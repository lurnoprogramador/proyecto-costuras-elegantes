(() => {
  const AppState = {
    user: null,
    selectedSize: null,
    selectedColor: null,
    selectedFabric: null,
    clients: [],
    measures: [],
    orders: []
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const Utils = {
    currency(value) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(Number(value) || 0);
    },

    formatDate(date) {
      if (!date) return 'Pendiente';
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return 'Pendiente';
      return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(d);
    },

    daysFromNow(days) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    },

    showToast(message, type = 'success') {
      let wrap = document.getElementById('toastContainer');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'toastContainer';
        wrap.style.position = 'fixed';
        wrap.style.right = '20px';
        wrap.style.bottom = '20px';
        wrap.style.zIndex = '9999';
        wrap.style.display = 'grid';
        wrap.style.gap = '10px';
        document.body.appendChild(wrap);
      }

      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.padding = '14px 16px';
      toast.style.borderRadius = '14px';
      toast.style.color = '#fff';
      toast.style.boxShadow = '0 12px 28px rgba(0,0,0,.18)';
      toast.style.background =
        type === 'error'
          ? 'rgba(181,61,85,.96)'
          : 'rgba(47,125,85,.96)';
      wrap.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    },

    async jsonFetch(url, options = {}) {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      return { ok: res.ok, status: res.status, data };
    },

    openModal({
      title,
      message,
      confirmText = 'Aceptar',
      cancelText = 'Cancelar',
      onConfirm
    }) {
      let overlay = document.getElementById('appModal');

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'appModal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="appModalTitle">
            <h3 id="appModalTitle"></h3>
            <p id="appModalMessage"></p>
            <div class="modal-actions">
              <button type="button" class="btn btn--secondary" id="modalCancelBtn">Cancelar</button>
              <button type="button" class="btn btn--primary" id="modalConfirmBtn">Confirmar</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      $('#appModalTitle').textContent = title;
      $('#appModalMessage').textContent = message;
      $('#modalConfirmBtn').textContent = confirmText;
      $('#modalCancelBtn').textContent = cancelText;
      overlay.classList.add('is-open');

      const close = () => overlay.classList.remove('is-open');
      $('#modalCancelBtn').onclick = close;
      overlay.onclick = (e) => {
        if (e.target === overlay) close();
      };

      $('#modalConfirmBtn').onclick = () => {
        if (typeof onConfirm === 'function') onConfirm();
        close();
      };
    }
  };

  const Catalog = {
    prendas: {
      camisa: 85000,
      pantalon: 110000,
      chaqueta: 180000,
      falda: 90000,
      vestido: 160000,
      saco: 140000,
      otro: 95000
    },
    telas: {
      algodon: 18000,
      lino: 32000,
      denim: 28000,
      seda: 45000,
      gabardina: 26000,
      poliester: 14000
    },
    tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colores: [
      { name: 'Negro Elegante', value: 'negro', hex: '#1d1d1f' },
      { name: 'Vino', value: 'vino', hex: '#7a284b' },
      { name: 'Beige', value: 'beige', hex: '#d9c2a3' },
      { name: 'Azul Noche', value: 'azul-noche', hex: '#253552' },
      { name: 'Blanco Perla', value: 'blanco-perla', hex: '#f4f0eb' },
      { name: 'Gris Acero', value: 'gris-acero', hex: '#82858d' }
    ]
  };

  const Api = {
    async getClients() {
      const res = await Utils.jsonFetch('/api/clientes');
      if (!res.ok) throw new Error('No se pudieron cargar clientes');
      return res.data.items || [];
    },

    async getMeasures() {
      const res = await Utils.jsonFetch('/api/medidas');
      if (!res.ok) throw new Error('No se pudieron cargar medidas');
      return res.data.items || [];
    },

    async getMeasureByClient(clienteid) {
      return Utils.jsonFetch(`/api/medidas/cliente/${clienteid}`);
    },

    async getOrders() {
      const res = await Utils.jsonFetch('/api/pedidos');
      if (!res.ok) throw new Error('No se pudieron cargar pedidos');
      return res.data.items || [];
    },

    async getOrderById(id) {
      return Utils.jsonFetch(`/api/pedidos/${id}`);
    },

    async createClient(payload) {
      return Utils.jsonFetch('/api/clientes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async createMeasures(payload) {
      return Utils.jsonFetch('/api/medidas', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async createOrder(payload) {
      return Utils.jsonFetch('/api/pedidos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async updateOrder(id, payload) {
      return Utils.jsonFetch(`/api/pedidos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    async cancelOrder(id) {
      return Utils.jsonFetch(`/api/pedidos/${id}/cancelar`, {
        method: 'POST'
      });
    }
  };

  const Navigation = {
    init() {
      const links = $$('.sidebar-menu-link[data-section], .nav-list-link[data-section]');

      links.forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          this.showSection(link.dataset.section);
        });
      });

      const userMenuTrigger = $('#userMenuTrigger');
      const userMenuDropdown = $('#userMenuDropdown');

      if (userMenuTrigger && userMenuDropdown) {
        userMenuTrigger.addEventListener('click', () => {
          userMenuDropdown.style.display =
            userMenuDropdown.style.display === 'block' ? 'none' : 'block';
        });
      }

      const logoutBtn = $('#logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', e => {
          e.preventDefault();
          localStorage.removeItem('ce_session_user');
          window.location.href = '/';
        });
      }
    },

    showSection(sectionName) {
      $$('.content-section').forEach(section => {
        section.classList.toggle(
          'content-section--active',
          section.dataset.section === sectionName
        );
      });

      $$('.sidebar-menu-link, .nav-list-link').forEach(link => {
        link.classList.toggle('sidebar-menu-link--active', link.dataset.section === sectionName);
        link.classList.toggle('nav-list-link--active', link.dataset.section === sectionName);
      });
    }
  };

  const Dashboard = {
    update() {
      $('#stat-total-clientes') &&
        ($('#stat-total-clientes').textContent = AppState.clients.length);

      $('#stat-pedidos-pendientes') &&
        ($('#stat-pedidos-pendientes').textContent =
          AppState.orders.filter(o => o.estado === 'pendiente').length);

      $('#stat-ingresos') &&
        ($('#stat-ingresos').textContent = Utils.currency(
          AppState.orders.reduce((s, o) => s + Number(o.anticipo || 0), 0)
        ));

      $('#stat-pedidos-completados') &&
        ($('#stat-pedidos-completados').textContent =
          AppState.orders.filter(o => o.estado === 'entregado' || o.estado === 'terminado').length);
    }
  };

  const Clients = {
    async init() {
      this.bindForm();
      await this.load();
      this.renderSelects();
      this.renderTable();
    },

    bindForm() {
      const form = $('#clienteForm');
      if (!form || form.dataset.bound === '1') return;
      form.dataset.bound = '1';

      form.addEventListener('submit', async e => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(form).entries());
        if (!data.codigo) data.codigo = `CLI-${String(Date.now()).slice(-6)}`;

        const res = await Api.createClient(data);
        if (!res.ok || !res.data.ok) {
          return Utils.showToast(res.data.message || 'Error al crear cliente', 'error');
        }

        Utils.showToast('Cliente creado correctamente');
        form.reset();
        await this.load();
        this.renderSelects();
        this.renderTable();
        Dashboard.update();
      });
    },

    async load() {
      try {
        AppState.clients = await Api.getClients();
      } catch {
        AppState.clients = [];
      }
    },

    renderSelects() {
      const selects = [$('#pedido-cliente'), $('#medidas-cliente')].filter(Boolean);

      selects.forEach(select => {
        select.innerHTML =
          `<option value="">Seleccione un cliente</option>` +
          AppState.clients
            .map(c => `<option value="${c.codigo}">${c.codigo} - ${c.nombre} ${c.apellido}</option>`)
            .join('');
      });
    },

    renderTable() {
      const tbody = $('#clientesTableBody');
      if (!tbody) return;

      tbody.innerHTML = AppState.clients.map(c => `
        <tr>
          <td>${c.codigo || '-'}</td>
          <td>${c.nombre || '-'}</td>
          <td>${c.apellido || '-'}</td>
          <td>${c.documento || '-'}</td>
          <td>${c.telefono || '-'}</td>
          <td>${c.email || '-'}</td>
          <td>-</td>
        </tr>
      `).join('');
    }
  };

  const Measures = {
    async init() {
      this.bindForm();
      await this.load();
    },

    bindForm() {
      const form = $('#medidasForm');
      if (!form || form.dataset.bound === '1') return;
      form.dataset.bound = '1';

      form.addEventListener('submit', async e => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(form).entries());
        const res = await Api.createMeasures(data);

        if (!res.ok || !res.data.ok) {
          return Utils.showToast(res.data.message || 'Error al guardar medidas', 'error');
        }

        Utils.showToast('Medidas guardadas correctamente');
        form.reset();
        await this.load();
      });
    },

    async load() {
      try {
        AppState.measures = await Api.getMeasures();
      } catch {
        AppState.measures = [];
      }
    }
  };

  const Orders = {
    editingOrderId: null,

    async init() {
      this.setAutoCode();
      this.bindInputs();
      this.bindForm();
      this.bindClientMeasurePreview();
      await this.load();
      this.renderTable();
      this.updateSummary();
      this.calculatePrice(true, true);
      this.autoEstimateDate();
      this.renderSizeOptions();
      this.renderFabricOptions();
      this.renderColorOptions();
      this.resetMeasurePreview();
    },

    setAutoCode() {
      const input = $('#pedido-codigo');
      if (input && !this.editingOrderId && !input.value) {
        input.value = `PED-${String(Date.now()).slice(-6)}`;
      }
    },

    bindInputs() {
      [
        'pedido-prenda',
        'pedido-cantidad',
        'pedido-precio',
        'pedido-anticipo',
        'pedido-estado',
        'pedido-fecha-entrega',
        'pedido-color',
        'pedido-tela'
      ].forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.bound === '1') return;
        el.dataset.bound = '1';

        el.addEventListener('input', () => {
          if (id === 'pedido-precio') {
            this.calculatePrice(false, false);
          } else if (id === 'pedido-anticipo') {
            this.calculatePrice(false, true);
          } else {
            this.calculatePrice(true, true);
          }

          this.autoEstimateDate();
          this.updateSummary();
        });

        el.addEventListener('change', () => {
          if (id === 'pedido-precio') {
            this.calculatePrice(false, false);
          } else if (id === 'pedido-anticipo') {
            this.calculatePrice(false, true);
          } else {
            this.calculatePrice(true, true);
          }

          this.autoEstimateDate();
          this.updateSummary();
        });

        if (id === 'pedido-precio') {
          el.addEventListener('blur', () => {
            this.calculatePrice(false, true);
          });
        }
      });
    },

    bindClientMeasurePreview() {
      const clientSelect = $('#pedido-cliente');
      if (!clientSelect || clientSelect.dataset.measureBound === '1') return;
      clientSelect.dataset.measureBound = '1';

      clientSelect.addEventListener('change', async () => {
        const clienteid = clientSelect.value;

        if (!clienteid) {
          this.resetMeasurePreview();
          return;
        }

        await this.loadMeasurePreview(clienteid);
      });
    },

    resetMeasurePreview() {
      const ids = [
        'mv-cuello',
        'mv-hombro',
        'mv-pecho',
        'mv-cintura',
        'mv-cadera',
        'mv-tiro',
        'mv-largopantalon',
        'mv-entrepierna',
        'mv-largototal',
        'mv-largomanga',
        'mv-anchomanga',
        'mv-contornobrazo',
        'mv-muneca'
      ];

      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '-';
      });

      const status = document.getElementById('pedidoMeasureStatus');
      if (status) status.textContent = 'Seleccione un cliente';

      const obs = document.getElementById('pedidoMeasureObs');
      if (obs) obs.textContent = 'Sin observaciones.';
    },

    async loadMeasurePreview(clienteid) {
      const status = document.getElementById('pedidoMeasureStatus');
      const obs = document.getElementById('pedidoMeasureObs');

      if (status) status.textContent = 'Cargando medidas...';
      if (obs) obs.textContent = 'Buscando registro más reciente del cliente.';

      const res = await Api.getMeasureByClient(clienteid);

      if (!res.ok || !res.data.ok) {
        this.resetMeasurePreview();
        if (status) status.textContent = 'Sin medidas registradas';
        if (obs) obs.textContent = res.data.message || 'Este cliente aún no tiene medidas guardadas.';
        return;
      }

      const m = res.data.item || {};
      const map = {
        'mv-cuello': m.cuello,
        'mv-hombro': m.hombro,
        'mv-pecho': m.pecho,
        'mv-cintura': m.cintura,
        'mv-cadera': m.cadera,
        'mv-tiro': m.tiro,
        'mv-largopantalon': m.largopantalon,
        'mv-entrepierna': m.entrepierna,
        'mv-largototal': m.largototal,
        'mv-largomanga': m.largomanga,
        'mv-anchomanga': m.anchomanga,
        'mv-contornobrazo': m.contornobrazo,
        'mv-muneca': m.muneca
      };

      Object.entries(map).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '-';
      });

      if (status) status.textContent = 'Medidas encontradas';
      if (obs) obs.textContent = m.observaciones || 'Sin observaciones.';
    },

    bindForm() {
      const form = $('#pedidoForm');
      if (!form || form.dataset.bound === '1') return;
      form.dataset.bound = '1';

      form.addEventListener('submit', async e => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(form).entries());
        data.talla = AppState.selectedSize || data.talla || 'M';
        data.color = data.color || AppState.selectedColor || '';
        data.tela = data.tela || AppState.selectedFabric || '';

        let res;

        if (this.editingOrderId) {
          res = await Api.updateOrder(this.editingOrderId, data);
        } else {
          res = await Api.createOrder(data);
        }

        if (!res.ok || !res.data.ok) {
          return Utils.showToast(res.data.message || 'Error al guardar pedido', 'error');
        }

        Utils.showToast(
          this.editingOrderId
            ? 'Pedido actualizado correctamente'
            : 'Pedido guardado correctamente'
        );

        form.reset();
        this.editingOrderId = null;
        AppState.selectedSize = null;
        AppState.selectedColor = null;
        AppState.selectedFabric = null;

        this.setAutoCode();
        this.resetMeasurePreview();
        await this.load();
        this.renderTable();
        this.updateSummary();
        this.calculatePrice(true, true);
        this.autoEstimateDate();
        this.renderSizeOptions();
        this.renderFabricOptions();
        this.renderColorOptions();
        Dashboard.update();
      });

      form.addEventListener('reset', () => {
        setTimeout(() => {
          this.editingOrderId = null;
          AppState.selectedSize = null;
          AppState.selectedColor = null;
          AppState.selectedFabric = null;
          this.setAutoCode();
          this.resetMeasurePreview();
          this.calculatePrice(true, true);
          this.autoEstimateDate();
          this.updateSummary();
          this.renderSizeOptions();
          this.renderFabricOptions();
          this.renderColorOptions();
        }, 0);
      });
    },

    async load() {
      try {
        AppState.orders = await Api.getOrders();
      } catch {
        AppState.orders = [];
      }
    },

    calculatePrice(forceAutoPrice = false, updateBalanceOnly = false) {
      const prenda = $('#pedido-prenda')?.value || 'otro';
      const cantidad = Math.max(Number($('#pedido-cantidad')?.value || 1), 1);
      const precioInput = $('#pedido-precio');
      const anticipoInput = $('#pedido-anticipo');
      const saldoInput = $('#pedido-saldo');
      const telaInput = $('#pedido-tela');

      const telaRaw = (telaInput?.value || '').toLowerCase().trim();
      if (telaRaw) AppState.selectedFabric = telaRaw;

      const telaKey = AppState.selectedFabric || telaRaw || '';
      const base = Catalog.prendas[prenda] || 0;
      const fabric = Catalog.telas[telaKey] || 0;

      const sizeFactor =
        ['XL', 'XXL'].includes(AppState.selectedSize)
          ? 1.12
          : AppState.selectedSize === 'XS'
            ? 0.96
            : 1;

      const auto = Math.round((base + fabric) * sizeFactor * cantidad);

      const rawManual = precioInput ? precioInput.value.trim() : '';
      const hasManualValue = rawManual !== '' && !Number.isNaN(Number(rawManual));
      const isFocused = document.activeElement === precioInput;

      let total = auto;

      if (updateBalanceOnly) {
        total = hasManualValue ? Number(rawManual) : auto;
      } else if (forceAutoPrice) {
        if (precioInput) precioInput.value = auto;
        total = auto;
      } else if (hasManualValue) {
        total = Number(rawManual);
      } else if (!isFocused) {
        if (precioInput) precioInput.value = auto;
        total = auto;
      } else {
        total = auto;
      }

      const anticipo = Number(anticipoInput?.value || 0);
      const saldo = Math.max(total - anticipo, 0);

      if (saldoInput) saldoInput.value = saldo;

      $('#smartTotal') && ($('#smartTotal').textContent = Utils.currency(total));
      $('#smartDeposit') && ($('#smartDeposit').textContent = Utils.currency(anticipo));
      $('#smartBalance') && ($('#smartBalance').textContent = Utils.currency(saldo));
    },

    autoEstimateDate() {
      const prenda = $('#pedido-prenda')?.value || 'otro';
      const cantidad = Number($('#pedido-cantidad')?.value || 1);
      const daysMap = {
        camisa: 4,
        pantalon: 5,
        chaqueta: 8,
        falda: 4,
        vestido: 7,
        saco: 6,
        otro: 5
      };

      const dateInput = $('#pedido-fecha-entrega');
      if (dateInput && !dateInput.value) {
        dateInput.value = Utils.daysFromNow(
          (daysMap[prenda] || 5) + (cantidad > 1 ? Math.ceil(cantidad / 2) : 0)
        );
      }

      $('#etaText') &&
        ($('#etaText').textContent = `Entrega sugerida: ${Utils.formatDate(dateInput?.value)}`);
      $('#summaryEntrega') &&
        ($('#summaryEntrega').textContent = Utils.formatDate(dateInput?.value));
    },

    updateSummary() {
      const map = {
        summaryPrenda: $('#pedido-prenda')?.selectedOptions?.[0]?.textContent || 'No seleccionada',
        summaryTalla: AppState.selectedSize || 'No seleccionada',
        summaryTela: $('#pedido-tela')?.value || AppState.selectedFabric || 'No seleccionada',
        summaryColor: $('#pedido-color')?.value || AppState.selectedColor || 'No seleccionado',
        summaryCantidad: $('#pedido-cantidad')?.value || '0'
      };

      Object.entries(map).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      });
    },

    renderSizeOptions() {
      const grid = $('#sizeGrid');
      if (!grid) return;

      grid.innerHTML = Catalog.tallas.map(size => `
        <button type="button" class="chip ${AppState.selectedSize === size ? 'is-active' : ''}" data-size="${size}">
          ${size}
        </button>
      `).join('');

      grid.querySelectorAll('[data-size]').forEach(btn => {
        btn.addEventListener('click', () => {
          AppState.selectedSize = btn.dataset.size;
          this.renderSizeOptions();
          this.calculatePrice(true, true);
          this.updateSummary();
        });
      });
    },

    renderFabricOptions() {
      const grid = $('#fabricGrid');
      if (!grid) return;

      grid.innerHTML = Object.entries(Catalog.telas).map(([k, v]) => `
        <button type="button" class="chip ${AppState.selectedFabric === k ? 'is-active' : ''}" data-fabric="${k}">
          ${k}<br><small>${Utils.currency(v)}</small>
        </button>
      `).join('');

      grid.querySelectorAll('[data-fabric]').forEach(btn => {
        btn.addEventListener('click', () => {
          AppState.selectedFabric = btn.dataset.fabric;
          const tela = $('#pedido-tela');
          if (tela) tela.value = btn.dataset.fabric;
          this.renderFabricOptions();
          this.calculatePrice(true, true);
          this.updateSummary();
        });
      });
    },

    renderColorOptions() {
      const grid = $('#colorGrid');
      if (!grid) return;

      grid.innerHTML = Catalog.colores.map(c => `
        <button
          type="button"
          class="color-option ${AppState.selectedColor === c.value ? 'is-active' : ''}"
          data-color="${c.value}"
          style="background:${c.hex}">
          <span>${c.name}</span>
        </button>
      `).join('');

      grid.querySelectorAll('[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
          const chosen = Catalog.colores.find(c => c.value === btn.dataset.color);
          AppState.selectedColor = btn.dataset.color;
          const colorInput = $('#pedido-color');
          if (colorInput && chosen) colorInput.value = chosen.name;
          this.renderColorOptions();
          this.updateSummary();
        });
      });
    },

    async editOrder(orderId) {
      const res = await Api.getOrderById(orderId);

      if (!res.ok || !res.data.ok) {
        return Utils.showToast(res.data.message || 'No se pudo cargar el pedido', 'error');
      }

      const order = res.data.item;
      this.editingOrderId = order._id;

      $('#pedido-codigo') && ($('#pedido-codigo').value = order.codigo || '');
      $('#pedido-cliente') && ($('#pedido-cliente').value = order.clienteid || '');
      $('#pedido-fecha-entrega') && ($('#pedido-fecha-entrega').value = order.fechaentrega || '');
      $('#pedido-estado') && ($('#pedido-estado').value = order.estado || '');
      $('#pedido-prenda') && ($('#pedido-prenda').value = order.tipoprenda || '');
      $('#pedido-cantidad') && ($('#pedido-cantidad').value = order.cantidad || 1);
      $('#pedido-tela') && ($('#pedido-tela').value = order.tela || '');
      $('#pedido-color') && ($('#pedido-color').value = order.color || '');
      $('#pedido-precio') && ($('#pedido-precio').value = order.precio || 0);
      $('#pedido-anticipo') && ($('#pedido-anticipo').value = order.anticipo || 0);
      $('#pedido-saldo') && ($('#pedido-saldo').value = order.saldopendiente || 0);
      $('#pedido-observaciones') && ($('#pedido-observaciones').value = order.observaciones || '');

      AppState.selectedFabric =
        Object.keys(Catalog.telas).find(k => k === String(order.tela || '').toLowerCase()) || null;

      AppState.selectedColor =
        Catalog.colores.find(c => c.name === order.color || c.value === order.color)?.value || null;

      AppState.selectedSize = order.talla || null;

      this.renderSizeOptions();
      this.renderFabricOptions();
      this.renderColorOptions();
      this.calculatePrice(false, true);
      this.updateSummary();

      if (order.clienteid) {
        await this.loadMeasurePreview(order.clienteid);
      } else {
        this.resetMeasurePreview();
      }

      Navigation.showSection('pedidos-crear');
      Utils.showToast('Pedido cargado para edición');
    },

    renderTable() {
      const tbody = $('#pedidosTableBody');
      if (!tbody) return;

      tbody.innerHTML = AppState.orders.map((o, i) => `
        <tr>
          <td>${o.codigo || '-'}</td>
          <td>${o.clienteid || '-'}</td>
          <td>${o.tipoprenda || '-'}</td>
          <td>${o.cantidad || 1}</td>
          <td>${o.estado || 'pendiente'}</td>
          <td>${Utils.currency(o.precio || 0)}</td>
          <td style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn btn--secondary" data-edit="${o._id || i}">Editar</button>
            <button type="button" class="btn btn--secondary" data-view="${o._id || i}">Resumen</button>
            <button type="button" class="btn btn--secondary" data-abono="${o._id || i}">Abonar</button>
            <button type="button" class="btn btn--secondary" data-cancel="${o._id || i}">Cancelar</button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const order =
            AppState.orders.find(o => (o._id || '') === btn.dataset.edit) ||
            AppState.orders[Number(btn.dataset.edit)];

          if (!order || !order._id) return;
          await this.editOrder(order._id);
        });
      });

      tbody.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const order =
            AppState.orders.find(o => (o._id || '') === btn.dataset.view) ||
            AppState.orders[Number(btn.dataset.view)];

          if (!order) return;

          Utils.openModal({
            title: `Resumen ${order.codigo || ''}`,
            message:
              `Cliente: ${order.clienteid || '-'} · ` +
              `Prenda: ${order.tipoprenda || '-'} · ` +
              `Total: ${Utils.currency(order.precio || 0)} · ` +
              `Abono: ${Utils.currency(order.anticipo || 0)} · ` +
              `Saldo: ${Utils.currency(order.saldopendiente || 0)}`
          });
        });
      });

      tbody.querySelectorAll('[data-abono]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const order =
            AppState.orders.find(o => (o._id || '') === btn.dataset.abono) ||
            AppState.orders[Number(btn.dataset.abono)];

          if (!order) return;

          const deposit = prompt('Nuevo abono:', '');
          if (deposit === null) return;

          const nuevoAbono = Number(deposit);
          if (Number.isNaN(nuevoAbono) || nuevoAbono <= 0) {
            return Utils.showToast('Abono inválido', 'error');
          }

          const anticipoActual = Number(order.anticipo || 0);
          const precioActual = Number(order.precio || 0);
          const anticipoTotal = anticipoActual + nuevoAbono;
          const saldopendiente = Math.max(precioActual - anticipoTotal, 0);

          const nuevoEstado =
            saldopendiente === 0 && order.estado !== 'cancelado'
              ? 'terminado'
              : order.estado;

          const res = await Api.updateOrder(order._id, {
            anticipo: anticipoTotal,
            precio: precioActual,
            saldopendiente,
            estado: nuevoEstado
          });

          if (!res.ok || !res.data.ok) {
            return Utils.showToast(res.data.message || 'No se pudo actualizar', 'error');
          }

          Utils.showToast('Abono actualizado');
          await this.load();
          this.renderTable();
          Dashboard.update();
        });
      });

      tbody.querySelectorAll('[data-cancel]').forEach(btn => {
        btn.addEventListener('click', () => {
          const order =
            AppState.orders.find(o => (o._id || '') === btn.dataset.cancel) ||
            AppState.orders[Number(btn.dataset.cancel)];

          if (!order) return;

          Utils.openModal({
            title: `Cancelar ${order.codigo || ''}`,
            message: 'Esta acción marcará el pedido como cancelado.',
            confirmText: 'Sí, cancelar',
            onConfirm: async () => {
              const res = await Api.cancelOrder(order._id);

              if (!res.ok || !res.data.ok) {
                return Utils.showToast(res.data.message || 'No se pudo cancelar', 'error');
              }

              Utils.showToast('Pedido cancelado', 'error');
              await this.load();
              this.renderTable();
              Dashboard.update();
            }
          });
        });
      });
    }
  };

  const AuthModule = {
    init() {
      const form = $('#loginForm');
      if (!form) return;

      const passwordInput = $('#auth-password');
      const togglePasswordBtn = $('#togglePasswordBtn');

      if (passwordInput && togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
          const isHidden = passwordInput.type === 'password';
          passwordInput.type = isHidden ? 'text' : 'password';
          togglePasswordBtn.textContent = isHidden ? 'Ocultar' : 'Ver';
        });
      }

      form.addEventListener('submit', async e => {
        e.preventDefault();

        const username = $('#auth-username')?.value.trim();
        const password = $('#auth-password')?.value.trim();
        const role = $('#auth-role')?.value;
        const errorBox = $('#auth-error');
        const errorMsg = $('#auth-error-message');
        const submitBtn = $('#submitBtn');

        if (errorBox) errorBox.style.display = 'none';
        if (errorMsg) errorMsg.textContent = '';

        if (!username || !password || !role) {
          if (errorBox && errorMsg) {
            errorBox.style.display = 'block';
            errorMsg.textContent = 'Debe completar usuario, contraseña y rol.';
          }
          return;
        }

        submitBtn && (submitBtn.disabled = true);

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
          });

          const data = await res.json();

          if (!res.ok || !data.ok) {
            if (errorBox && errorMsg) {
              errorBox.style.display = 'block';
              errorMsg.textContent = data.message || 'No fue posible iniciar sesión.';
            }
            return;
          }

          localStorage.setItem('ce_session_user', JSON.stringify(data.user));
          window.location.href = '/panel';
        } catch {
          if (errorBox && errorMsg) {
            errorBox.style.display = 'block';
            errorMsg.textContent = 'No fue posible conectar con el servidor.';
          }
        } finally {
          submitBtn && (submitBtn.disabled = false);
        }
      });
    }
  };

  const DashboardApp = {
    async init() {
      const session = localStorage.getItem('ce_session_user');
      if (!session) {
        window.location.href = '/';
        return;
      }

      try {
        AppState.user = JSON.parse(session);
      } catch {
        AppState.user = null;
      }

      const currentUserName = $('#currentUserName');
      if (currentUserName) currentUserName.textContent = AppState.user?.name || 'Usuario';

      Navigation.init();
      await Clients.init();
      await Measures.init();
      await Orders.init();
      Dashboard.update();

      const groups = [
        ['clientesGroupToggle', 'clientesSubmenu'],
        ['medidasGroupToggle', 'medidasSubmenu'],
        ['pedidosGroupToggle', 'pedidosSubmenu']
      ];

      groups.forEach(([btnId, menuId]) => {
        const btn = document.getElementById(btnId);
        const menu = document.getElementById(menuId);
        if (!btn || !menu) return;
        menu.style.display = 'none';
        btn.addEventListener('click', () => {
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
      });
    }
  };

  window.AuthModule = AuthModule;
  window.DashboardApp = DashboardApp;
})();
(() => {
  const state = {
    selectedSize: null,
    selectedFabric: null,
    selectedColor: null,
    clients: [],
    measures: [],
    orders: [],
    user: null,
    catalog: {
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
      colores: [
        { name: 'Negro', value: 'negro', hex: '#1d1d1f' },
        { name: 'Vino', value: 'vino', hex: '#7a284b' },
        { name: 'Beige', value: 'beige', hex: '#d9c2a3' },
        { name: 'Azul noche', value: 'azul-noche', hex: '#253552' },
        { name: 'Perla', value: 'perla', hex: '#f1ede7' }
      ],
      tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    }
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  const helpers = {
    money(value) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(Number(value) || 0);
    },
    date(value) {
      if (!value) return 'Pendiente';
      return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(value));
    },
    nextCode(prefix, length) {
      return `${prefix}-${String(length + 1).padStart(3, '0')}`;
    },
    notify(message, type = 'success') {
      let container = $('#toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        Object.assign(container.style, {
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          zIndex: '999',
          display: 'grid',
          gap: '10px',
          maxWidth: '320px'
        });
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.padding = '14px 16px';
      toast.style.borderRadius = '16px';
      toast.style.color = '#fff';
      toast.style.boxShadow = '0 12px 30px rgba(0,0,0,.18)';
      toast.style.background = type === 'error' ? 'rgba(181,61,85,.95)' : 'rgba(47,125,85,.95)';
      container.appendChild(toast);

      setTimeout(() => toast.remove(), 3000);
    }
  };

  const data = {
    load() {
      state.clients = storage.get('ce_clients', []);
      state.measures = storage.get('ce_measures', []);
      state.orders = storage.get('ce_orders', []);
      state.user = storage.get('ce_session_user', { username: 'Administrador', role: 'admin' });
    },
    save() {
      storage.set('ce_clients', state.clients);
      storage.set('ce_measures', state.measures);
      storage.set('ce_orders', state.orders);
    }
  };

  const auth = {
    init() {
      const form = $('#loginForm');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = $('#auth-username')?.value.trim();
        const password = $('#auth-password')?.value.trim();
        const role = $('#auth-role')?.value;
        const errorBox = $('#auth-error');
        const errorText = $('#auth-error-message');

        if (!username || !password || !role) {
          if (errorBox && errorText) {
            errorBox.style.display = 'block';
            errorText.textContent = 'Debe completar usuario, contraseña y rol.';
          }
          return;
        }

        storage.set('ce_session_user', { username, role });
        window.location.href = 'index_panel.html';
      });
    }
  };

  const navigation = {
    init() {
      const links = $$('[data-section]');
      const sections = $$('.content-section');

      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = link.dataset.section;
          if (!target) return;

          sections.forEach(section => {
            section.classList.toggle('content-section--active', section.dataset.section === target);
          });

          $$('.sidebar-menu-link').forEach(el => el.classList.remove('sidebar-menu-link--active'));
          $$('.nav-list-link').forEach(el => el.classList.remove('nav-list-link--active'));

          if (link.classList.contains('sidebar-menu-link')) link.classList.add('sidebar-menu-link--active');
          if (link.classList.contains('nav-list-link')) link.classList.add('nav-list-link--active');
        });
      });

      [
        ['clientesGroupToggle', 'clientesSubmenu'],
        ['medidasGroupToggle', 'medidasSubmenu'],
        ['pedidosGroupToggle', 'pedidosSubmenu']
      ].forEach(([buttonId, menuId]) => {
        const button = document.getElementById(buttonId);
        const menu = document.getElementById(menuId);
        if (!button || !menu) return;
        menu.style.display = 'none';
        button.addEventListener('click', () => {
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
      });

      const userMenuTrigger = $('#userMenuTrigger');
      const userMenuDropdown = $('#userMenuDropdown');

      if (userMenuTrigger && userMenuDropdown) {
        userMenuTrigger.addEventListener('click', () => {
          userMenuDropdown.style.display = userMenuDropdown.style.display === 'none' ? 'block' : 'none';
        });
      }

      const logoutBtn = $('#logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('ce_session_user');
          window.location.href = 'index_login.html';
        });
      }
    }
  };

  const clients = {
    init() {
      this.setCode();
      this.populateSelects();
      this.renderTable();

      const form = $('#clienteForm');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = Object.fromEntries(new FormData(form).entries());

        if (!payload.nombre || !payload.apellido || !payload.documento || !payload.telefono || !payload.email) {
          helpers.notify('Complete todos los campos obligatorios del cliente.', 'error');
          return;
        }

        state.clients.push(payload);
        data.save();
        this.renderTable();
        this.populateSelects();
        dashboard.updateStats();
        form.reset();
        this.setCode();
        helpers.notify('Cliente registrado correctamente.');
      });
    },

    setCode() {
      const input = $('#cliente-codigo');
      if (input) input.value = helpers.nextCode('CLI', state.clients.length);
    },

    populateSelects() {
      ['pedido-cliente', 'medidas-cliente'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const first = select.querySelector('option')?.outerHTML || '<option value="">Seleccione</option>';
        select.innerHTML = first + state.clients.map(client => `
          <option value="${client.codigo}">${client.codigo} - ${client.nombre} ${client.apellido}</option>
        `).join('');
      });
    },

    renderTable() {
      const tbody = $('#clientesTableBody');
      if (!tbody) return;

      tbody.innerHTML = state.clients.map(client => `
        <tr>
          <td>${client.codigo || '-'}</td>
          <td>${client.nombre || '-'}</td>
          <td>${client.apellido || '-'}</td>
          <td>${client.documento || '-'}</td>
          <td>${client.telefono || '-'}</td>
          <td>${client.email || '-'}</td>
          <td><button type="button" class="btn btn--secondary">Ver</button></td>
        </tr>
      `).join('');
    }
  };

  const measures = {
    init() {
      const form = $('#medidasForm');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = Object.fromEntries(new FormData(form).entries());

        if (!payload.clienteid) {
          helpers.notify('Seleccione un cliente para registrar medidas.', 'error');
          return;
        }

        const index = state.measures.findIndex(item => item.clienteid === payload.clienteid);
        if (index >= 0) state.measures[index] = payload;
        else state.measures.push(payload);

        data.save();
        form.reset();
        helpers.notify('Medidas guardadas correctamente.');
      });
    }
  };

  const orders = {
    init() {
      this.setCode();
      this.renderSizes();
      this.renderFabrics();
      this.renderColors();
      this.bindInputs();
      this.bindForm();
      this.renderTable();
      this.autoDate();
      this.calculate();
      this.updateSummary();
    },

    setCode() {
      const input = $('#pedido-codigo');
      if (input) input.value = helpers.nextCode('PED', state.orders.length);
    },

    bindInputs() {
      [
        '#pedido-prenda',
        '#pedido-cantidad',
        '#pedido-precio',
        '#pedido-anticipo',
        '#pedido-fecha-entrega',
        '#pedido-estado',
        '#pedido-color',
        '#pedido-tela'
      ].forEach(selector => {
        const field = $(selector);
        if (!field) return;
        field.addEventListener('input', () => {
          this.autoDate();
          this.calculate();
          this.updateSummary();
        });
        field.addEventListener('change', () => {
          this.autoDate();
          this.calculate();
          this.updateSummary();
        });
      });

      $('#orderSearch')?.addEventListener('input', () => this.renderTable());
      $('#orderStatusFilter')?.addEventListener('change', () => this.renderTable());
    },

    renderSizes() {
      const grid = $('#sizeGrid');
      if (!grid) return;

      grid.innerHTML = state.catalog.tallas.map(size => `
        <button type="button" class="chip ${state.selectedSize === size ? 'is-active' : ''}" data-size="${size}">
          ${size}
        </button>
      `).join('');

      $$('[data-size]', grid).forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedSize = btn.dataset.size;
          this.renderSizes();
          this.calculate();
          this.updateSummary();
        });
      });
    },

    renderFabrics() {
      const grid = $('#fabricGrid');
      if (!grid) return;

      grid.innerHTML = Object.entries(state.catalog.telas).map(([key, value]) => `
        <button type="button" class="chip ${state.selectedFabric === key ? 'is-active' : ''}" data-fabric="${key}">
          ${key}<br><small>${helpers.money(value)}</small>
        </button>
      `).join('');

      $$('[data-fabric]', grid).forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedFabric = btn.dataset.fabric;
          const input = $('#pedido-tela');
          if (input) input.value = btn.dataset.fabric;
          this.renderFabrics();
          this.calculate();
          this.updateSummary();
        });
      });
    },

    renderColors() {
      const grid = $('#colorGrid');
      if (!grid) return;

      grid.innerHTML = state.catalog.colores.map(color => `
        <button type="button" class="color-option ${state.selectedColor === color.name ? 'is-active' : ''}" data-color="${color.name}" style="background:${color.hex}">
          <span>${color.name}</span>
        </button>
      `).join('');

      $$('[data-color]', grid).forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedColor = btn.dataset.color;
          const input = $('#pedido-color');
          if (input) input.value = btn.dataset.color;
          this.renderColors();
          this.updateSummary();
        });
      });
    },

    autoDate() {
      const prenda = $('#pedido-prenda')?.value || 'otro';
      const cantidad = Number($('#pedido-cantidad')?.value || 1);
      const estado = $('#pedido-estado')?.value || 'pendiente';
      const input = $('#pedido-fecha-entrega');

      const daysMap = {
        camisa: 4,
        pantalon: 5,
        chaqueta: 8,
        falda: 4,
        vestido: 7,
        saco: 6,
        otro: 5
      };

      const days = (daysMap[prenda] || 5) + Math.max(0, Math.ceil((cantidad - 1) / 2));
      const date = new Date();
      date.setDate(date.getDate() + days);
      const iso = date.toISOString().split('T')[0];

      if (input && !input.value) input.value = iso;

      const etaText = $('#etaText');
      const statusPreview = $('#statusPreview');
      if (etaText) etaText.textContent = `Entrega sugerida: ${helpers.date(input?.value || iso)}.`;
      if (statusPreview) statusPreview.textContent = `Estado inicial: ${estado}`;
    },

    calculate() {
      const prenda = $('#pedido-prenda')?.value || 'otro';
      const cantidad = Number($('#pedido-cantidad')?.value || 1);
      const precioInput = $('#pedido-precio');
      const anticipoInput = $('#pedido-anticipo');
      const saldoInput = $('#pedido-saldo');

      const base = state.catalog.prendas[prenda] || 0;
      const fabricExtra = state.catalog.telas[state.selectedFabric] || 0;
      const sizeMultiplier =
        ['XL', 'XXL'].includes(state.selectedSize) ? 1.12 :
        state.selectedSize === 'XS' ? 0.96 : 1;

      const autoTotal = Math.round((base + fabricExtra) * sizeMultiplier * cantidad);
      const manual = Number(precioInput?.value || 0);
      const total = manual > 0 ? manual : autoTotal;

      if (precioInput && manual === 0) precioInput.value = total;

      const anticipo = Number(anticipoInput?.value || 0);
      const saldo = Math.max(total - anticipo, 0);
      if (saldoInput) saldoInput.value = saldo;

      $('#smartTotal') && ($('#smartTotal').textContent = helpers.money(total));
      $('#smartDeposit') && ($('#smartDeposit').textContent = helpers.money(anticipo));
      $('#smartBalance') && ($('#smartBalance').textContent = helpers.money(saldo));
    },

    updateSummary() {
      const prendaText = $('#pedido-prenda')?.selectedOptions?.[0]?.textContent || 'No seleccionada';
      const cantidad = $('#pedido-cantidad')?.value || '0';
      const tela = $('#pedido-tela')?.value || 'No seleccionada';
      const color = $('#pedido-color')?.value || 'No seleccionado';
      const entrega = $('#pedido-fecha-entrega')?.value || '';

      const map = {
        summaryPrenda: prendaText,
        summaryTalla: state.selectedSize || 'No seleccionada',
        summaryTela: tela,
        summaryColor: color,
        summaryCantidad: cantidad,
        summaryEntrega: entrega ? helpers.date(entrega) : 'Pendiente'
      };

      Object.entries(map).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      });
    },

    filtered() {
      const text = ($('#orderSearch')?.value || '').toLowerCase();
      const status = $('#orderStatusFilter')?.value || 'all';

      return state.orders.filter(order => {
        const haystack = `${order.codigo} ${order.clienteid} ${order.tipoprenda}`.toLowerCase();
        const byText = !text || haystack.includes(text);
        const byStatus = status === 'all' || order.estado === status;
        return byText && byStatus;
      });
    },

    renderTable() {
      const tbody = $('#pedidosTableBody');
      if (!tbody) return;

      const list = this.filtered();

      tbody.innerHTML = list.map(order => {
        const index = state.orders.indexOf(order);
        const statusClass = {
          pendiente: 'pending',
          enproceso: 'progress',
          terminado: 'done',
          entregado: 'done',
          cancelado: 'cancelled'
        }[order.estado] || 'pending';

        return `
          <tr>
            <td>${order.codigo || '-'}</td>
            <td>${order.clienteid || '-'}</td>
            <td>${order.tipoprenda || '-'}</td>
            <td>${order.cantidad || 1}</td>
            <td><span class="status-pill ${statusClass}">${order.estado || 'pendiente'}</span></td>
            <td>${helpers.money(order.precio || 0)}</td>
            <td style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn btn--secondary" data-view="${index}">Resumen</button>
              <button type="button" class="btn btn--secondary" data-deposit="${index}">Abonar</button>
              <button type="button" class="btn btn--secondary" data-cancel="${index}">Cancelar</button>
            </td>
          </tr>
        `;
      }).join('');

      $$('[data-view]', tbody).forEach(btn => {
        btn.addEventListener('click', () => {
          const order = state.orders[Number(btn.dataset.view)];
          if (!order) return;
          alert(
            `Pedido: ${order.codigo}\nCliente: ${order.clienteid}\nPrenda: ${order.tipoprenda}\nTalla: ${order.talla}\nTotal: ${helpers.money(order.precio)}\nAbono: ${helpers.money(order.anticipo)}\nSaldo: ${helpers.money(order.saldopendiente)}\nEntrega: ${helpers.date(order.fechaentrega)}`
          );
        });
      });

      $$('[data-deposit]', tbody).forEach(btn => {
        btn.addEventListener('click', () => {
          const order = state.orders[Number(btn.dataset.deposit)];
          if (!order) return;

          const amount = Number(prompt('Ingrese el nuevo abono', order.anticipo || 0));
          if (Number.isNaN(amount) || amount < 0) {
            helpers.notify('Ingrese un valor de abono válido.', 'error');
            return;
          }

          order.anticipo = amount;
          order.saldopendiente = Math.max(Number(order.precio) - amount, 0);
          data.save();
          this.renderTable();
          dashboard.updateStats();
          helpers.notify('Abono actualizado correctamente.');
        });
      });

      $$('[data-cancel]', tbody).forEach(btn => {
        btn.addEventListener('click', () => {
          const order = state.orders[Number(btn.dataset.cancel)];
          if (!order) return;

          if (!confirm(`¿Cancelar el pedido ${order.codigo}?`)) return;

          order.estado = 'cancelado';
          data.save();
          this.renderTable();
          dashboard.updateStats();
          helpers.notify('Pedido cancelado.', 'error');
        });
      });
    },

    bindForm() {
      const form = $('#pedidoForm');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = Object.fromEntries(new FormData(form).entries());

        if (!payload.clienteid || !payload.tipoprenda || !payload.precio) {
          helpers.notify('Debe completar cliente, prenda y precio.', 'error');
          return;
        }

        if (!state.selectedSize) {
          helpers.notify('Debe seleccionar una talla.', 'error');
          return;
        }

        payload.talla = state.selectedSize;
        payload.tela = payload.tela || state.selectedFabric || 'No especificada';
        payload.color = payload.color || state.selectedColor || 'No especificado';
        payload.precio = Number(payload.precio || 0);
        payload.anticipo = Number(payload.anticipo || 0);
        payload.saldopendiente = Number(payload.saldopendiente || 0);

        state.orders.push(payload);
        data.save();
        this.renderTable();
        dashboard.updateStats();

        form.reset();
        state.selectedSize = null;
        state.selectedFabric = null;
        state.selectedColor = null;

        this.setCode();
        this.renderSizes();
        this.renderFabrics();
        this.renderColors();
        this.autoDate();
        this.calculate();
        this.updateSummary();

        helpers.notify('Pedido registrado correctamente.');
      });
    }
  };

  const dashboard = {
    init() {
      const currentUserName = $('#currentUserName');
      if (currentUserName) currentUserName.textContent = state.user?.username || 'Usuario';
      this.updateStats();
    },

    updateStats() {
      const totalClientes = $('#stat-total-clientes');
      const pedidosPendientes = $('#stat-pedidos-pendientes');
      const ingresos = $('#stat-ingresos');
      const completados = $('#stat-pedidos-completados');

      const pendientes = state.orders.filter(item => item.estado === 'pendiente').length;
      const totalIngresos = state.orders.reduce((acc, item) => acc + Number(item.anticipo || 0), 0);
      const totalCompletados = state.orders.filter(item => ['terminado', 'entregado'].includes(item.estado)).length;

      if (totalClientes) totalClientes.textContent = state.clients.length;
      if (pedidosPendientes) pedidosPendientes.textContent = pendientes;
      if (ingresos) ingresos.textContent = helpers.money(totalIngresos);
      if (completados) completados.textContent = totalCompletados;
    }
  };

  const app = {
    initPanel() {
      data.load();
      navigation.init();
      clients.init();
      measures.init();
      orders.init();
      dashboard.init();
    }
  };

  window.AuthModule = auth;
  window.DashboardApp = app;
})();
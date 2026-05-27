(() => {
  const App = {
    state: {
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
    },

    load() {
      this.state.clients = this.read('ce_clients', [
        {
          codigo: 'CLI-001',
          genero: 'femenino',
          nombre: 'Laura',
          apellido: 'Gómez',
          documento: '1032456789',
          telefono: '3101234567',
          email: 'laura@email.com',
          direccion: 'Bogotá',
          observaciones: 'Cliente frecuente'
        }
      ]);
      this.state.measures = this.read('ce_measures', []);
      this.state.orders = this.read('ce_orders', []);
      this.state.user = this.read('ce_session_user', { username: 'Administrador', role: 'admin' });
    },

    save() {
      localStorage.setItem('ce_clients', JSON.stringify(this.state.clients));
      localStorage.setItem('ce_measures', JSON.stringify(this.state.measures));
      localStorage.setItem('ce_orders', JSON.stringify(this.state.orders));
    },

    read(key, fallback) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
      } catch {
        return fallback;
      }
    },

    money(value) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(Number(value) || 0);
    },

    formatDate(value) {
      if (!value) return 'Pendiente';
      return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(value));
    },

    toast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    },

    modal({ title, message, confirmText = 'Aceptar', cancelText = 'Cancelar', onConfirm }) {
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

      overlay.querySelector('#appModalTitle').textContent = title;
      overlay.querySelector('#appModalMessage').textContent = message;
      overlay.querySelector('#modalConfirmBtn').textContent = confirmText;
      overlay.querySelector('#modalCancelBtn').textContent = cancelText;

      overlay.classList.add('is-open');

      const close = () => overlay.classList.remove('is-open');
      overlay.querySelector('#modalCancelBtn').onclick = close;
      overlay.onclick = (e) => {
        if (e.target === overlay) close();
      };

      overlay.querySelector('#modalConfirmBtn').onclick = () => {
        if (typeof onConfirm === 'function') onConfirm();
        close();
      };
    },

    setAutoCodes() {
      const clienteCodigo = document.getElementById('cliente-codigo');
      const pedidoCodigo = document.getElementById('pedido-codigo');

      if (clienteCodigo) {
        clienteCodigo.value = `CLI-${String(this.state.clients.length + 1).padStart(3, '0')}`;
      }

      if (pedidoCodigo) {
        pedidoCodigo.value = `PED-${String(this.state.orders.length + 1).padStart(3, '0')}`;
      }
    },

    setCurrentUser() {
      const currentUserName = document.getElementById('currentUserName');
      if (currentUserName) currentUserName.textContent = this.state.user?.username || 'Usuario';
    },

    populateClientSelects() {
      ['pedido-cliente', 'medidas-cliente'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const first = select.querySelector('option')?.outerHTML || '<option value="">Seleccione</option>';
        select.innerHTML = first + this.state.clients.map(client => `
          <option value="${client.codigo}">${client.codigo} - ${client.nombre} ${client.apellido}</option>
        `).join('');
      });
    },

    renderClientsTable() {
      const tbody = document.getElementById('clientesTableBody');
      if (!tbody) return;

      tbody.innerHTML = this.state.clients.map(client => `
        <tr>
          <td>${client.codigo || '-'}</td>
          <td>${client.nombre || '-'}</td>
          <td>${client.apellido || '-'}</td>
          <td>${client.documento || '-'}</td>
          <td>${client.telefono || '-'}</td>
          <td>${client.email || '-'}</td>
          <td><button type="button" class="btn btn--secondary" data-client-view="${client.codigo}">Ver</button></td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-client-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const client = this.state.clients.find(c => c.codigo === btn.dataset.clientView);
          if (!client) return;

          this.modal({
            title: `Cliente ${client.codigo}`,
            message: `${client.nombre} ${client.apellido}. Documento: ${client.documento}. Teléfono: ${client.telefono}. Email: ${client.email}. Dirección: ${client.direccion || 'No registrada'}.`
          });
        });
      });
    },

    renderSizeOptions() {
      const grid = document.getElementById('sizeGrid');
      if (!grid) return;

      grid.innerHTML = this.state.catalog.tallas.map(size => `
        <button type="button" class="chip ${this.state.selectedSize === size ? 'is-active' : ''}" data-size="${size}">
          ${size}
        </button>
      `).join('');

      grid.querySelectorAll('[data-size]').forEach(btn => {
        btn.onclick = () => {
          this.state.selectedSize = btn.dataset.size;
          this.renderSizeOptions();
          this.updateSummary();
          this.calculatePrice();
        };
      });
    },

    renderFabricOptions() {
      const grid = document.getElementById('fabricGrid');
      if (!grid) return;

      grid.innerHTML = Object.entries(this.state.catalog.telas).map(([key, price]) => `
        <button type="button" class="chip ${this.state.selectedFabric === key ? 'is-active' : ''}" data-fabric="${key}">
          ${key}<br><small>${this.money(price)}</small>
        </button>
      `).join('');

      grid.querySelectorAll('[data-fabric]').forEach(btn => {
        btn.onclick = () => {
          this.state.selectedFabric = btn.dataset.fabric;
          const tela = document.getElementById('pedido-tela');
          if (tela) tela.value = btn.dataset.fabric;
          this.renderFabricOptions();
          this.updateSummary();
          this.calculatePrice();
        };
      });
    },

    renderColorOptions() {
      const grid = document.getElementById('colorGrid');
      if (!grid) return;

      grid.innerHTML = this.state.catalog.colores.map(color => `
        <button
          type="button"
          class="color-option ${this.state.selectedColor === color.name ? 'is-active' : ''}"
          data-color="${color.name}"
          style="background:${color.hex}"
        >
          <span>${color.name}</span>
        </button>
      `).join('');

      grid.querySelectorAll('[data-color]').forEach(btn => {
        btn.onclick = () => {
          this.state.selectedColor = btn.dataset.color;
          const colorInput = document.getElementById('pedido-color');
          if (colorInput) colorInput.value = btn.dataset.color;
          this.renderColorOptions();
          this.updateSummary();
        };
      });
    },

    autoEstimateDate() {
      const prenda = document.getElementById('pedido-prenda')?.value || 'otro';
      const cantidad = Number(document.getElementById('pedido-cantidad')?.value || 1);
      const estado = document.getElementById('pedido-estado')?.value || 'pendiente';
      const fechaEntrega = document.getElementById('pedido-fecha-entrega');

      const map = {
        camisa: 4,
        pantalon: 5,
        chaqueta: 8,
        falda: 4,
        vestido: 7,
        saco: 6,
        otro: 5
      };

      const days = (map[prenda] || 5) + Math.max(0, Math.ceil((cantidad - 1) / 2));
      const suggested = new Date();
      suggested.setDate(suggested.getDate() + days);
      const iso = suggested.toISOString().split('T')[0];

      if (fechaEntrega && !fechaEntrega.value) fechaEntrega.value = iso;

      const etaText = document.getElementById('etaText');
      const summaryEntrega = document.getElementById('summaryEntrega');
      const statusPreview = document.getElementById('statusPreview');

      if (etaText) etaText.textContent = `Entrega sugerida: ${this.formatDate(fechaEntrega?.value || iso)}.`;
      if (summaryEntrega) summaryEntrega.textContent = this.formatDate(fechaEntrega?.value || iso);
      if (statusPreview) statusPreview.textContent = `Estado inicial: ${estado || 'pendiente'}`;
    },

    calculatePrice() {
      const prenda = document.getElementById('pedido-prenda')?.value || 'otro';
      const cantidad = Number(document.getElementById('pedido-cantidad')?.value || 1);
      const precioInput = document.getElementById('pedido-precio');
      const anticipoInput = document.getElementById('pedido-anticipo');
      const saldoInput = document.getElementById('pedido-saldo');

      const base = this.state.catalog.prendas[prenda] || 0;
      const fabricExtra = this.state.catalog.telas[this.state.selectedFabric] || 0;
      const sizeMultiplier =
        ['XL', 'XXL'].includes(this.state.selectedSize) ? 1.12 :
        this.state.selectedSize === 'XS' ? 0.96 : 1;

      const autoTotal = Math.round((base + fabricExtra) * sizeMultiplier * cantidad);
      const typedTotal = Number(precioInput?.value || 0);
      const total = typedTotal > 0 ? typedTotal : autoTotal;

      if (precioInput && typedTotal === 0) precioInput.value = total;

      const anticipo = Number(anticipoInput?.value || 0);
      const saldo = Math.max(total - anticipo, 0);

      if (saldoInput) saldoInput.value = saldo;

      const smartTotal = document.getElementById('smartTotal');
      const smartDeposit = document.getElementById('smartDeposit');
      const smartBalance = document.getElementById('smartBalance');

      if (smartTotal) smartTotal.textContent = this.money(total);
      if (smartDeposit) smartDeposit.textContent = this.money(anticipo);
      if (smartBalance) smartBalance.textContent = this.money(saldo);
    },

    updateSummary() {
      const prenda = document.getElementById('pedido-prenda');
      const cantidad = document.getElementById('pedido-cantidad')?.value || '0';
      const tela = document.getElementById('pedido-tela')?.value || 'No seleccionada';
      const color = document.getElementById('pedido-color')?.value || 'No seleccionado';
      const fecha = document.getElementById('pedido-fecha-entrega')?.value || '';

      const summary = {
        summaryPrenda: prenda?.selectedOptions?.[0]?.textContent || 'No seleccionada',
        summaryTalla: this.state.selectedSize || 'No seleccionada',
        summaryTela: tela,
        summaryColor: color,
        summaryCantidad: cantidad,
        summaryEntrega: fecha ? this.formatDate(fecha) : 'Pendiente'
      };

      Object.entries(summary).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      });
    },

    filteredOrders() {
      const search = document.getElementById('orderSearch')?.value?.toLowerCase() || '';
      const status = document.getElementById('orderStatusFilter')?.value || 'all';

      return this.state.orders.filter(order => {
        const text = `${order.codigo} ${order.clienteid} ${order.tipoprenda}`.toLowerCase();
        const matchesSearch = !search || text.includes(search);
        const matchesStatus = status === 'all' || order.estado === status;
        return matchesSearch && matchesStatus;
      });
    },

    renderOrdersTable() {
      const tbody = document.getElementById('pedidosTableBody');
      if (!tbody) return;

      const items = this.filteredOrders();

      tbody.innerHTML = items.map((order) => {
        const originalIndex = this.state.orders.indexOf(order);
        return `
          <tr>
            <td>${order.codigo || '-'}</td>
            <td>${order.clienteid || '-'}</td>
            <td>${order.tipoprenda || '-'}</td>
            <td>${order.cantidad || 1}</td>
            <td>${order.estado || 'pendiente'}</td>
            <td>${this.money(order.precio || 0)}</td>
            <td style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn btn--secondary" data-view="${originalIndex}">Resumen</button>
              <button type="button" class="btn btn--secondary" data-deposit="${originalIndex}">Abonar</button>
              <button type="button" class="btn btn--secondary" data-cancel="${originalIndex}">Cancelar</button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('[data-view]').forEach(btn => {
        btn.onclick = () => {
          const order = this.state.orders[btn.dataset.view];
          if (!order) return;

          this.modal({
            title: `Resumen ${order.codigo}`,
            message: `Cliente: ${order.clienteid}. Prenda: ${order.tipoprenda}. Talla: ${order.talla}. Total: ${this.money(order.precio)}. Abono: ${this.money(order.anticipo)}. Saldo: ${this.money(order.saldopendiente)}. Entrega: ${this.formatDate(order.fechaentrega)}.`
          });
        };
      });

      tbody.querySelectorAll('[data-deposit]').forEach(btn => {
        btn.onclick = () => {
          const order = this.state.orders[btn.dataset.deposit];
          if (!order) return;

          const amount = Number(prompt('Ingrese el nuevo abono', order.anticipo || 0));
          if (Number.isNaN(amount) || amount < 0) {
            this.toast('Ingrese un valor de abono válido.', 'error');
            return;
          }

          order.anticipo = amount;
          order.saldopendiente = Math.max(Number(order.precio) - amount, 0);
          this.save();
          this.renderOrdersTable();
          this.updateStats();
          this.toast('Abono actualizado correctamente.');
        };
      });

      tbody.querySelectorAll('[data-cancel]').forEach(btn => {
        btn.onclick = () => {
          const order = this.state.orders[btn.dataset.cancel];
          if (!order) return;

          this.modal({
            title: `Cancelar ${order.codigo}`,
            message: 'Esta acción marcará el pedido como cancelado y conservará su historial.',
            confirmText: 'Sí, cancelar',
            onConfirm: () => {
              order.estado = 'cancelado';
              this.save();
              this.renderOrdersTable();
              this.updateStats();
              this.toast('Pedido cancelado.', 'error');
            }
          });
        };
      });
    },

    updateStats() {
      const totalClientes = document.getElementById('stat-total-clientes');
      const pedidosPendientes = document.getElementById('stat-pedidos-pendientes');
      const ingresos = document.getElementById('stat-ingresos');
      const completados = document.getElementById('stat-pedidos-completados');

      const pendientes = this.state.orders.filter(order => order.estado === 'pendiente').length;
      const totalIngresos = this.state.orders.reduce((acc, item) => acc + Number(item.anticipo || 0), 0);
      const totalCompletados = this.state.orders.filter(order => ['terminado', 'entregado'].includes(order.estado)).length;

      if (totalClientes) totalClientes.textContent = this.state.clients.length;
      if (pedidosPendientes) pedidosPendientes.textContent = pendientes;
      if (ingresos) ingresos.textContent = this.money(totalIngresos);
      if (completados) completados.textContent = totalCompletados;
    },

    initLogin() {
      const form = document.getElementById('loginForm');
      if (!form) return;

      const username = document.getElementById('auth-username');
      const password = document.getElementById('auth-password');
      const role = document.getElementById('auth-role');
      const submitBtn = document.getElementById('submitBtn');
      const errorBox = document.getElementById('auth-error');
      const errorMsg = document.getElementById('auth-error-message');
      const togglePassword = document.getElementById('togglePassword');

      const showError = (message) => {
        errorMsg.textContent = message;
        errorBox.style.display = 'block';
      };

      const hideError = () => {
        errorBox.style.display = 'none';
      };

      [username, password, role].forEach(field => {
        field?.addEventListener('input', hideError);
        field?.addEventListener('change', hideError);
      });

      togglePassword?.addEventListener('click', () => {
        const isPassword = password.type === 'password';
        password.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? 'Ocultar' : 'Ver';
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const userValue = username.value.trim();
        const passValue = password.value.trim();
        const roleValue = role.value;

        if (!userValue || !passValue || !roleValue) {
          showError('Debe completar usuario, contraseña y rol.');
          return;
        }

        if (passValue.length < 8) {
          showError('La contraseña debe tener mínimo 8 caracteres.');
          return;
        }

        submitBtn.classList.add('is-loading');

        setTimeout(() => {
          localStorage.setItem('ce_session_user', JSON.stringify({
            username: userValue,
            role: roleValue
          }));
          hideError();
          window.location.href = 'index_panel.html';
        }, 900);
      });
    },

    initNavigation() {
      const navLinks = document.querySelectorAll('[data-section]');
      const sections = document.querySelectorAll('.content-section');

      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = link.dataset.section;

          sections.forEach(section => {
            section.classList.toggle('content-section--active', section.dataset.section === target);
          });

          document.querySelectorAll('.sidebar-menu-link, .nav-list-link').forEach(item => {
            item.classList.remove('sidebar-menu-link--active', 'nav-list-link--active');
          });

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
    },

    initUserMenu() {
      const trigger = document.getElementById('userMenuTrigger');
      const dropdown = document.getElementById('userMenuDropdown');
      const logoutBtn = document.getElementById('logoutBtn');

      if (trigger && dropdown) {
        trigger.addEventListener('click', () => {
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
      }

      logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('ce_session_user');
        window.location.href = 'index_login.html';
      });
    },

    bindClientForm() {
      const form = document.getElementById('clienteForm');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());

        if (!data.nombre || !data.apellido || !data.documento || !data.telefono || !data.email) {
          this.toast('Complete los campos obligatorios del cliente.', 'error');
          return;
        }

        this.state.clients.push(data);
        this.save();
        this.populateClientSelects();
        this.renderClientsTable();
        this.updateStats();
        form.reset();
        this.setAutoCodes();
        this.toast('Cliente registrado correctamente.');
      });
    },

    bindMeasuresForm() {
      const form = document.getElementById('medidasForm');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());

        if (!data.clienteid) {
          this.toast('Seleccione un cliente para registrar medidas.', 'error');
          return;
        }

        this.state.measures.push(data);
        this.save();
        form.reset();
        this.toast('Medidas guardadas correctamente.');
      });
    },

    bindOrderInputs() {
      [
        'pedido-prenda',
        'pedido-cantidad',
        'pedido-precio',
        'pedido-anticipo',
        'pedido-fecha-entrega',
        'pedido-estado',
        'pedido-color',
        'pedido-tela'
      ].forEach(id => {
        const field = document.getElementById(id);
        field?.addEventListener('input', () => {
          this.autoEstimateDate();
          this.calculatePrice();
          this.updateSummary();
        });
        field?.addEventListener('change', () => {
          this.autoEstimateDate();
          this.calculatePrice();
          this.updateSummary();
        });
      });

      document.getElementById('orderSearch')?.addEventListener('input', () => this.renderOrdersTable());
      document.getElementById('orderStatusFilter')?.addEventListener('change', () => this.renderOrdersTable());
    },

    bindOrderForm() {
      const form = document.getElementById('pedidoForm');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());

        if (!data.clienteid || !data.tipoprenda || !data.precio) {
          this.toast('Debe completar cliente, prenda y precio.', 'error');
          return;
        }

        if (!this.state.selectedSize) {
          this.toast('Debe seleccionar una talla.', 'error');
          return;
        }

        data.talla = this.state.selectedSize;
        data.tela = data.tela || this.state.selectedFabric || 'No especificada';
        data.color = data.color || this.state.selectedColor || 'No especificado';
        data.precio = Number(data.precio || 0);
        data.anticipo = Number(data.anticipo || 0);
        data.saldopendiente = Number(data.saldopendiente || 0);

        this.state.orders.push(data);
        this.save();
        this.renderOrdersTable();
        this.updateStats();
        form.reset();

        this.state.selectedSize = null;
        this.state.selectedFabric = null;
        this.state.selectedColor = null;

        this.renderSizeOptions();
        this.renderFabricOptions();
        this.renderColorOptions();
        this.setAutoCodes();
        this.autoEstimateDate();
        this.calculatePrice();
        this.updateSummary();
        this.toast('Pedido registrado correctamente.');
      });
    },

    initPanel() {
      this.load();
      this.setCurrentUser();
      this.initNavigation();
      this.initUserMenu();
      this.populateClientSelects();
      this.renderClientsTable();
      this.renderSizeOptions();
      this.renderFabricOptions();
      this.renderColorOptions();
      this.bindClientForm();
      this.bindMeasuresForm();
      this.bindOrderInputs();
      this.bindOrderForm();
      this.renderOrdersTable();
      this.updateStats();
      this.setAutoCodes();
      this.autoEstimateDate();
      this.calculatePrice();
      this.updateSummary();
    }
  };

  window.AuthModule = {
    init: () => App.initLogin()
  };

  window.DashboardApp = {
    init: () => App.initPanel()
  };
})();
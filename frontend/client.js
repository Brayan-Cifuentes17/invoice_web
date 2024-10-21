const { createApp } = Vue;

const port = "4000";
const ip = "localhost";

createApp({
  data() {
    return {
      invoiceNumber: "",
      customerName: "",
      id_customer: "",
      email: "",
      address: "",
      date: "",
      productSearch: "",
      selectedProduct: null,
      quantity: 1,
      paymentMethod: "",
      id_employee: "",
      employees: [],
      products: [],
      items: [],
      viewingInvoice: null,
      invoices: [],
      editingInvoice: null,
      documentType: "",
      gender: "",
      phone: "",
      customerSearch: "", // Campo de búsqueda para los clientes
      selectedCustomer: null, // Cliente seleccionado
      customers: [],
      invoiceSearch: "",
      newUser: {
        id_persona:"",
        tipo_documento: "",
        nombres: "",
        apellidos: "",
        correo: "",
        genero: "",
        direccion: "",
        telefono: "",
        login: "",
        clave: "",
        tipo: "",
      },
    };
  },
  computed: {
    filteredCustomers() {
      return this.customers.filter(
        (customer) =>
          customer.ID_PERSONA.toString().includes(this.customerSearch) // Filtra por ID
      );
    },
    filteredInvoices() {
      if (!this.invoiceSearch) {
        return [];
      }
      return this.invoices.filter(
        (invoice) =>
          invoice.ID_FACTURA &&
          invoice.ID_FACTURA.toString().includes(this.invoiceSearch)
      );
    },
    filteredProducts() {
      return this.products.filter((product) =>
        product.NOMBRE.toLowerCase().includes(this.productSearch.toLowerCase())
      );
    },
    subtotal() {
      return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    },

    iva() {
      return this.subtotal * 0.19;
    },

    total() {
      return this.subtotal + this.iva;
    },
  },
  methods: {
    async fetchCustomers() {
      try {
        const response = await fetch(`http://${ip}:${port}/customers`);
        if (!response.ok) {
          throw new Error("Error al obtener clientes");
        }
        this.customers = await response.json();
      } catch (error) {
        console.error("Error al obtener clientes:", error);
      }
    },

    selectCustomer(customer) {
      this.customerName = customer.NOMBRES + " " + customer.APELLIDOS; // Mostrar nombre completo
      this.id_customer = customer.ID_PERSONA; // Asigna el ID del cliente
      this.address = customer.DIRECCION; // Asigna la dirección del cliente
      this.email = customer.CORREO; // Asigna el email del cliente
      this.phone = customer.TELEFONO; // Asigna el teléfono del cliente
      this.customerSearch = ""; // Limpia el campo de búsqueda
    },
    async fetchProducts() {
      try {
        const response = await fetch(`http://${ip}:${port}/products`);
        if (!response.ok) {
          throw new Error("Error al obtener productos");
        }
        this.products = await response.json();
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    },

    async fetchEmployees() {
      try {
        const response = await fetch(`http://${ip}:${port}/employees`);
        if (!response.ok) {
          throw new Error("Error al buscar empleados");
        }
        this.employees = await response.json();
      } catch (error) {
        console.error("Error al obtener empleados:", error);
      }
    },

    async fetchInvoices() {
      try {
        const response = await fetch(`http://${ip}:${port}/invoices`);
        if (!response.ok) {
          throw new Error("Error al obtener facturas");
        }
        this.invoices = await response.json();
      } catch (error) {
        console.error("Error al obtener facturas:", error);
      }
    },
    async fetchLastInvoiceNumber() {
      try {
        const response = await fetch(`http://${ip}:${port}/lastInvoiceNumber`);
        if (!response.ok) {
          throw new Error("Error al obtener el último número de factura");
        }
        const result = await response.json();
        this.invoiceNumber = result.lastInvoiceNumber + 1; // Establecer el próximo número de factura
      } catch (error) {
        console.error("Error al obtener el último número de factura:", error);
      }
    },

    selectProduct(product) {
      this.selectedProduct = product;
      this.productSearch = product.NOMBRE;
    },

    addItem() {
      if (!this.selectedProduct) {
        alert("Por favor selecciona un producto.");
        return;
      }

      this.items.push({
        id: this.selectedProduct.ID_PRODUCTO,
        name: this.selectedProduct.NOMBRE,
        lote: this.selectedProduct.ID_LOTE,
        unitPrice: parseFloat(this.selectedProduct.VALOR_UNITARIO),
        quantity: this.quantity,
        totalPrice:
          this.quantity * parseFloat(this.selectedProduct.VALOR_UNITARIO),
      });

      this.selectedProduct = null;
      this.quantity = 1;
    },

    removeItem(index) {
      this.items.splice(index, 1);
    },

    async generateInvoice() {
      const invoiceData = {
        invoiceNumber: this.invoiceNumber,
        id_customer: this.id_customer, // Usa id_customer
        date: this.date,
        items: this.items,
        subtotal: this.subtotal,
        paymentMethod: this.paymentMethod,
        employee: this.id_employee,
      };

      try {
        const response = await fetch(`http://${ip}:${port}/createInvoices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoiceData),
        });
        if (!response.ok) {
          throw new Error("Error al generar la factura");
        }
        const result = await response.json();
        alert(result.message);
        this.clearInvoiceForm();
        this.fetchInvoices();
      } catch (error) {
        console.error("Error al generar la factura:", error);
      }
    },

    clearInvoiceForm() {
      this.invoiceNumber = "";
      this.customerName = "";
      this.email = "";
      this.address = "";
      this.date = "";
      this.items = [];
      this.paymentMethod = "";
      this.id_employee = "";
      this.document = "";
      this.documentType = "";
      this.gender = "";
      this.phone = "";
    },

    editInvoice(invoice) {
      this.editingInvoice = { ...invoice };
    },

    async updateInvoice() {
      try {
        const response = await fetch(
          `http://${ip}:${port}/update/${this.editingInvoice.ID_FACTURA}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(this.editingInvoice),
          }
        );
        if (!response.ok) {
          throw new Error("Error al actualizar la factura");
        }
        this.editingInvoice = null;
        this.fetchInvoices();
      } catch (error) {
        console.error("Error al actualizar la factura:", error);
      }
    },

    // Método para ver la factura seleccionada
    async viewInvoice(invoice) {
      try {
        const response = await fetch(
          `http://${ip}:${port}/viewInvoice/${invoice.ID_FACTURA}`
        );
        if (!response.ok) {
          throw new Error("Error al obtener los detalles de la factura");
        }
        const data = await response.json();

        this.viewingInvoice = {
          ...data[0],
          detalles: data.map((item) => ({
            ID_PRODUCTO: item.ID_PRODUCTO,
            NOMBRE: item.NOMBRE,
            CANTIDAD: item.CANTIDAD,
            SUB_TOTAL: item.SUB_TOTAL,
            IVA: item.IVA,
            TOTAL_PAGAR: item.TOTAL_PAGAR,
          })),
        };
      } catch (error) {
        console.error("Error al obtener los detalles de la factura:", error);
      }
    },

    async deleteInvoice(id) {
      try {
        const response = await fetch(`http://${ip}:${port}/delete/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Error al eliminar la factura");
        }
        const result = await response.json();
        alert(result.message);
        this.fetchInvoices();
      } catch (error) {
        console.error("Error al eliminar la factura:", error);
      }
    },
    openNewUserTab() {
      window.open("new_user.html", "_blank"); // Abrir la nueva pestaña
    },

    formatDate(dateString) {
      const options = { year: "numeric", month: "2-digit", day: "2-digit" };
      return new Date(dateString).toLocaleDateString("es-ES", options);
    },
    async createUser() {
      const newUserData = {
        id_persona:this.newUser.id_persona,
        tipo_documento: this.newUser.tipo_documento,
        nombres: this.newUser.nombres,
        apellidos: this.newUser.apellidos,
        correo: this.newUser.correo,
        genero: this.newUser.genero,
        direccion: this.newUser.direccion,
        telefono: this.newUser.telefono,
        login: this.newUser.login,
        clave: this.newUser.clave,
        tipo: this.newUser.tipo,
      };

      try {
        const response = await fetch(`http://${ip}:${port}/createUser`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUserData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }

        const result = await response.json();
        alert(result.message);

        if (window.opener) {
          window.opener.location.reload();
      }
        window.close(); 
      } catch (error) {
        console.error("Error al registrar el usuario:", error);
        alert(error.message);
        window.close(); 
      }
    },
  },
  mounted() {
    this.fetchProducts();
    this.fetchEmployees();
    this.fetchInvoices();
    this.fetchLastInvoiceNumber();
    this.fetchCustomers();
  },
}).mount("#app");

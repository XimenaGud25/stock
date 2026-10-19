import type { Branch } from "@/types";

// Datos de EJEMPLO. Cambia direcciones, teléfonos y horarios por los reales
// (o sírvelos desde GET /branches cuando exista el backend).
export const branches: Branch[] = [
  {
    id: "b1",
    name: "Sucursal Centro",
    tag: "Matriz",
    address: "Av. Constituyentes 245, Col. Centro",
    city: "Querétaro, Qro.",
    postalCode: "76000",
    phone: "(442) 215 4800",
    whatsapp: "4423187720",
    email: "centro@stockherramienta.mx",
    mapQuery: "Av. Constituyentes 245, Centro, Querétaro",
    hours: {
      0: null,
      1: { open: "08:00", close: "19:00" },
      2: { open: "08:00", close: "19:00" },
      3: { open: "08:00", close: "19:00" },
      4: { open: "08:00", close: "19:00" },
      5: { open: "08:00", close: "19:00" },
      6: { open: "08:00", close: "15:00" },
    },
    services: ["Recoger en tienda", "Mayoreo", "Facturación", "Estacionamiento"],
  },
  {
    id: "b2",
    name: "Sucursal Norte",
    tag: "Bodega y mostrador",
    address: "Blvd. Bernardo Quintana 1180, Zona Industrial",
    city: "Querétaro, Qro.",
    postalCode: "76120",
    phone: "(442) 246 9135",
    whatsapp: "4425510394",
    email: "norte@stockherramienta.mx",
    mapQuery: "Blvd. Bernardo Quintana 1180, Querétaro",
    hours: {
      0: null,
      1: { open: "07:30", close: "18:30" },
      2: { open: "07:30", close: "18:30" },
      3: { open: "07:30", close: "18:30" },
      4: { open: "07:30", close: "18:30" },
      5: { open: "07:30", close: "18:30" },
      6: { open: "08:00", close: "14:00" },
    },
    services: ["Recoger en tienda", "Mayoreo", "Facturación", "Carga de camioneta"],
  },
];

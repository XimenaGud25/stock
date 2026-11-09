/**
 * Datos para que el cliente pague por transferencia.
 * ⚠️ Son de EJEMPLO: con un cliente real, aquí se ponen su banco, CLABE y titular.
 */
export const BANK_ACCOUNT = {
  bank: "BBVA México",
  holder: "Stock Herramienta S.A. de C.V.",
  clabe: "012180001234567895",
  /** Cuánto tiempo se aparta un pedido en espera de la transferencia */
  holdHours: 48,
};

/** "012180001234567895" → "012 180 00123456789 5" (como viene en el estado de cuenta) */
export const formatClabe = (c: string) => `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 17)} ${c.slice(17)}`;

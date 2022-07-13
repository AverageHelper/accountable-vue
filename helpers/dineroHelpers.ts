import { dinero } from "dinero.js";
import { USD } from "@dinero.js/currencies";

export const zeroDinero = dinero({ amount: 0, currency: USD });

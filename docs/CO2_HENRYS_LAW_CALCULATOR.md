# CO₂ from Pressure Calculator (Henry's Law)

## Purpose

This module estimates dissolved CO₂ concentration in beverages as **g/L** from:

- Liquid temperature (°C)
- Package pressure (bar)

It is designed for fast R&D and process estimation, with transparent assumptions.

## Equations Used

### 1) Henry's Law

\[
c = k*H(T) \cdot p*{CO_2}
\]

Where:

- \(c\): dissolved CO₂ concentration in mol/kg (approximately mol/L for water-like liquids)
- \(k_H(T)\): Henry constant in mol/(kg·bar)
- \(p\_{CO_2}\): CO₂ partial pressure in bar (absolute)

### 2) Temperature dependence of Henry constant (NIST form)

\[
k*H(T) = k*{H0} \cdot \exp\left(A\left(\frac{1}{T} - \frac{1}{T_0}\right)\right)
\]

Default parameters (configurable):

- \(k\_{H0} = 0.034\) mol/(kg·bar)
- \(A = 2400\) K
- \(T_0 = 298.15\) K
- \(T = tempC + 273.15\) K

### 3) Pressure handling and CO₂ partial pressure

- If pressure type = **Gauge**: \(P\_{abs} = P_g + 1.01325\)
- If pressure type = **Absolute**: \(P*{abs} = P*{input}\)

Default headspace assumption:
\[
p*{CO_2} = P*{abs} \cdot y*{CO_2}, \quad y*{CO_2}=1.0
\]

Optional water-vapor correction:
\[
p*{CO_2} = (P*{abs} - p*{H_2O}(T)) \cdot y*{CO*2}
\]
with clamp to keep \(p*{CO_2} \ge 0\).

Water vapor pressure uses Antoine approximation (bar).

### 4) Conversion to g/L

\[
CO_2\_{g/L} = c\_{mol/kg} \cdot MW\_{CO_2} \cdot \rho
\]

Where:

- \(MW\_{CO_2} = 44.0095\) g/mol
- \(\rho\) is liquid density in kg/L (default 1.000)

## Unit Conventions

- Temperature: °C input, converted internally to K
- Pressure: bar input
- Pressure type selectable as Gauge or Absolute
- Solubility output: g/L

## Input Scope & Guardrails

- Temperature: -1 to 60 °C
- Pressure: 0 to 12 bar (absolute equivalent)
- Gauge pressure cannot be negative
- Headspace CO₂ fraction: 0 to 1

Soft warning ranges are shown for user guidance:

- Temperature outside 0–40 °C
- Pressure above typical packaging range
- Computed CO₂ above 12 g/L

## Limitations

- Ideal/engineering estimate based on Henry's law for CO₂ in water-like systems.
- Real beverage matrix effects (sugar, acids, salts, alcohol) can shift solubility.
- Use as a practical estimate and validate with lab measurements when needed.

## When to use

- Early-stage carbonation target setting
- Packaging/process what-if calculations
- Fast checks during formulation development

## When not to use

- Final specification sign-off without lab confirmation
- Non-water-like systems where composition strongly changes gas solubility
- Extreme process conditions outside module ranges

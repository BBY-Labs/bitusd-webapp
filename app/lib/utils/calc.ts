// Computes the debt limit based on the collateral amount and the LTV value
// - collateralAmount is user input
// - ltv is fetched from the contract, and expressed as a number between 0 and 100
export function computeDebtLimit(
  collateralAmount: number,
  ltvValue: number,
  bitcoinPrice: number
) {
  return ((collateralAmount * ltvValue) / 100) * bitcoinPrice;
}

// Computes the liquidation price based on the collateral amount and the debt
// - collateralAmount is user input
// - debt is user input
// - ltv is fetched from the contract, and expressed as a number between 0 and 100
// Given a collateralAmount of 2 BTC, a debt of 100 bitUSD and an ltv of 80%, the liquidation price
// would be such that 2 BTC * liqPrice = 80 / 100 * 100
// i.e liqPrice = 0.8 * 100 / 2, on with variable names:
// liqPrice = ltv / 100  * debtValue / collateralAmount
export function computeLiquidationPrice(
  collateralAmount: number,
  debt: number,
  ltv: number,
  bitcoinPrice: number,
  bitUSDPrice: number
) {
  const collateralValue = collateralAmount * bitcoinPrice;
  const ltvPercentage = ltv / 100;
  const debtValue = debt * bitUSDPrice;
  return (ltvPercentage * debtValue) / collateralAmount;
}

// Computes the health factor based on the collateral amount and the debt
export function computeHealthFactor(
  collateralAmount: number,
  debt: number,
  ltv: number,
  bitcoinPrice: number,
  bitUSDPrice: number
) {
  const liquidationPrice = computeLiquidationPrice(
    collateralAmount,
    debt,
    ltv,
    bitcoinPrice,
    bitUSDPrice
  );
  const collateralValue = collateralAmount * bitcoinPrice;
  const debtValue = debt * bitUSDPrice;
  return (collateralValue * liquidationPrice) / debtValue;
}

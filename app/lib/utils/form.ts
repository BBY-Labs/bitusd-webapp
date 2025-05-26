import type { ZodError } from "zod/v4";

/**
 * Get appropriate button text based on form validation errors
 * @param formErrors - Zod validation errors or null
 * @returns Button text string
 */
export function getBorrowButtonText(
  formErrors: ZodError<{
    collateralAmount?: number;
    borrowAmount?: number;
  }> | null
): string {
  if (!formErrors) {
    return "Borrow";
  }

  const insufficientBalanceError = formErrors.issues.find(
    (issue) =>
      issue.path.includes("collateralAmount") &&
      issue.message === "Insufficient balance."
  );
  if (insufficientBalanceError) {
    return "Insufficient balance";
  }

  const collateralTooHighError = formErrors.issues.find(
    (issue) =>
      issue.path.includes("borrowAmount") &&
      issue.message === "Not enough collateral to borrow this amount."
  );
  if (collateralTooHighError) {
    return "Not enough collateral";
  }

  const borrowTooSmallError = formErrors.issues.find(
    (issue) =>
      issue.path.includes("borrowAmount") &&
      issue.message === "Minimum borrow amount is $100."
  );
  if (borrowTooSmallError) {
    return "Minimum $100 borrow";
  }

  const needCollateralError = formErrors.issues.find(
    (issue) =>
      issue.path.includes("borrowAmount") &&
      issue.message ===
        "Please enter a valid collateral amount before specifying a borrow amount."
  );
  if (needCollateralError) {
    return "Enter collateral first";
  }

  return "Check inputs";
}

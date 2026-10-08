import { Prisma } from "@prisma/client";

type PriceableProduct = {
  sellingPrice: Prisma.Decimal;
  memberPrice: Prisma.Decimal | null;
  wholesalePrice: Prisma.Decimal | null;
  wholesaleMinQuantity: number;
};

export function customerUnitPrice(product: PriceableProduct, customerType: string | null | undefined, quantity: number) {
  if (customerType === "Wholesale" && product.wholesalePrice && quantity >= product.wholesaleMinQuantity) {
    return product.wholesalePrice;
  }
  if (customerType === "Member" && product.memberPrice) return product.memberPrice;
  return product.sellingPrice;
}

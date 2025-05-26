import { Contract, RpcProvider } from "starknet";
import { PRICE_FEED_ABI, PRICE_FEED_BTC } from "~/lib/constants";

export const getBitcoinprice = async () => {
  const myProvider = new RpcProvider({
    nodeUrl: process.env.NODE_URL,
  });

  const PriceFeedContract = new Contract(
    PRICE_FEED_ABI,
    PRICE_FEED_BTC,
    myProvider
  );

  const price = await PriceFeedContract.fetch_price();

  return price;
};

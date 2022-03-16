import { gql } from "graphql-request";
import { PriceHistory } from "../../models";
import { SyncStat as SyncStatService } from "../../services";
import { fetchAll } from "../../subgraph";
import { SUSHISWAP_SUBGRAPH_URL, network } from "./index";

const wethQuery = gql`
  query PairHourDatas($pair: String!, $date: Int!, $lastId: ID) {
    data: pairHourDatas(
      first: 1000
      where: { pair: $pair, date_gte: $date, id_gt: $lastId }
    ) {
      id
      timestamp: date
      reserve0
      reserve1
    }
  }
`;

export async function syncWethPrice() {
  console.log("syncing WETH price");

  const TOKEN_WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const POOL_USDC_WETH = "0x397ff1542f962076d0bfe58ea045ffa2d347aca0";
  const entity = "weth";

  const variables = {
    date: 1654041600, // 1 Jun 2021
    pair: POOL_USDC_WETH,
  };

  const lastId = await SyncStatService.getLastIdOf(entity, network);

  const result = await fetchAll(
    SUSHISWAP_SUBGRAPH_URL,
    wethQuery,
    lastId,
    variables
  );
  await SyncStatService.updateLastIdOf(entity, network, result.lastId);

  const bulkWriteQuery = result.documents.map((doc) => {
    let priceUSD = parseFloat(doc.reserve0) / parseFloat(doc.reserve1);
    return {
      updateOne: {
        filter: {
          token: TOKEN_WETH,
          timestamp: doc.timestamp,
        },
        update: {
          token: TOKEN_WETH,
          timestamp: doc.timestamp,
          priceUSD,
        },
        upsert: true,
      },
    };
  });

  await PriceHistory.bulkWrite(bulkWriteQuery);
  console.log("Synced WETH price history");
}

import { gql } from "graphql-request";
import { PriceHistory } from "../../models";
import { SyncStat as SyncStatService } from "../../services";
import { fetchAll } from "../../subgraph";
import { getPriceMap } from "../../services/price.service";
import { UNISWAP_V3_SUBGRAPH_URL, network } from "./index";

const query = gql`
  query PoolHourDatas($pair: String!, $date: Int!, $lastId: ID) {
    data: poolHourDatas(
      first: 1000
      where: { pool: $pair, periodStartUnix_gt: $date, id_gt: $lastId }
    ) {
      id
      timestamp: periodStartUnix
      priceInEth: token0Price
    }
  }
`;

export async function syncBtrflyPrice() {
  console.log("syncing BTRFLY price");

  const POOL_WETH_BTRFLY = "0xdf9ab3c649005ebfdf682d2302ca1f673e0d37a2";
  const TOKEN_WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const TOKEN_BTRFLY = "0xC0d4Ceb216B3BA9C3701B291766fDCbA977ceC3A";

  const entity = "btrfly";

  const variables = {
    date: 1654041600, // 1 Jun 2021
    pair: POOL_WETH_BTRFLY.toLowerCase(),
  };

  const lastId = await SyncStatService.getLastIdOf(entity, network);

  const result = await fetchAll(
    UNISWAP_V3_SUBGRAPH_URL,
    query,
    lastId,
    variables
  );
  await SyncStatService.updateLastIdOf(entity, network, result.lastId);

  const wethPriceMap = await getPriceMap(TOKEN_WETH);

  const bulkWriteQuery = result.documents.map((doc) => {
    let priceInEth = parseFloat(doc.priceInEth);
    let wethPrice = wethPriceMap[doc.timestamp];
    let priceUSD = priceInEth * wethPrice;
    return {
      updateOne: {
        filter: {
          token: TOKEN_BTRFLY,
          timestamp: doc.timestamp,
        },
        update: {
          token: TOKEN_BTRFLY,
          timestamp: doc.timestamp,
          priceUSD,
        },
        upsert: true,
      },
    };
  });

  await PriceHistory.bulkWrite(bulkWriteQuery);
  console.log("Synced BTRFLY price history");
}

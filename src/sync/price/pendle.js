import { gql } from "graphql-request";
import { PriceHistory } from "../../models";
import { SyncStat as SyncStatService } from "../../services";
import { fetchAll } from "../../subgraph";
import { getPriceMap } from "../../services/price.service";
import { SUSHISWAP_SUBGRAPH_URL, network } from "./index";

const pendleQuery = gql`
  query PairHourDatas($pair: String!, $lastId: ID) {
    data: pairHourDatas(first: 1000, where: { pair: $pair, id_gt: $lastId }) {
      id
      timestamp: date
      reserve0
      reserve1
    }
  }
`;

export async function syncPendlePrice() {
  console.log("syncing PENDLE price");

  const TOKEN_WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const TOKEN_PENDLE = "0x808507121b80c02388fad14726482e061b8da827";
  const POOL_PENDLE_WETH = "0x37922c69b08babcceae735a31235c81f1d1e8e43";
  const entity = "pendle";

  const variables = {
    pair: POOL_PENDLE_WETH,
  };

  const lastId = await SyncStatService.getLastIdOf(entity, network);

  const result = await fetchAll(
    SUSHISWAP_SUBGRAPH_URL,
    pendleQuery,
    lastId,
    variables
  );
  await SyncStatService.updateLastIdOf(entity, network, result.lastId);

  const wethPriceMap = await getPriceMap(TOKEN_WETH);

  const bulkWriteQuery = result.documents.map((doc) => {
    let priceInEth = parseFloat(doc.reserve1) / parseFloat(doc.reserve0);
    let wethPrice = wethPriceMap[doc.timestamp];
    let priceUSD = priceInEth * wethPrice;
    return {
      updateOne: {
        filter: {
          token: TOKEN_PENDLE,
          timestamp: doc.timestamp,
        },
        update: {
          token: TOKEN_PENDLE,
          timestamp: doc.timestamp,
          priceUSD,
        },
        upsert: true,
      },
    };
  });

  await PriceHistory.bulkWrite(bulkWriteQuery);
  console.log("Synced PENDLE price history");
}

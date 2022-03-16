import { gql } from "graphql-request";

export default gql`
  query YieldContracts($lastId: ID) {
    data: yieldContracts(first: 1000, where: { id_gt: $lastId }) {
      id
      block
      timestamp
      forgeId
      expiry
      underlyingToken {
        id
      }
      yieldBearingToken {
        id
      }
      ot {
        id
      }
      yt {
        id
      }
    }
  }
`;

import { gql } from "graphql-request";

export default gql`
  query Markets($lastId: ID) {
    data: markets(first: 1000, where: { id_gt: $lastId }) {
      id
      block
      timestamp
      type
      token0 {
        id
      }
      token1 {
        id
      }
      baseToken {
        id
      }
      quoteToken {
        id
      }
      startTime
      expiry
      name
    }
  }
`;

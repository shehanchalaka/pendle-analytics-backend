import { gql } from "graphql-request";

export default gql`
  query Transactions($lastId: ID) {
    data: transactions(first: 1000, where: { id_gt: $lastId }) {
      id
      hash
      block
      timestamp
      market {
        id
      }
      yieldContract {
        id
      }
      user {
        id
      }
      action
      inputs {
        token {
          id
        }
        amount
        amountUSD
        price
      }
      outputs {
        token {
          id
        }
        amount
        amountUSD
        price
      }
      amountUSD
    }
  }
`;

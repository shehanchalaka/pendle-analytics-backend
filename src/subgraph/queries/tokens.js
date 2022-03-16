import { gql } from "graphql-request";

export default gql`
  query Tokens($lastId: ID) {
    data: tokens(first: 1000, where: { id_gt: $lastId }) {
      id
      name
      symbol
      decimals
      type
    }
  }
`;

import { gql } from "graphql-request";

export default gql`
  query UserTokens($lastId: ID) {
    data: userTokens(first: 1000, where: { id_gt: $lastId }) {
      id
      token {
        id
      }
      user {
        id
      }
      totalReceived
      totalSent
      balance
    }
  }
`;

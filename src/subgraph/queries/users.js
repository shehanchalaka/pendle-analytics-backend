import { gql } from "graphql-request";

export default gql`
  query Users($lastId: ID) {
    data: users(first: 1000, where: { id_gt: $lastId }) {
      id
    }
  }
`;

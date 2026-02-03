import { db } from "~/server/db";
import { ClientsRepository } from "./clients.repository";
import {
  ClientDomainError,
  ClientsService as ClientsServiceBase,
  type Role,
} from "./clients.logic";

export { ClientDomainError, type Role };

export class ClientsService extends ClientsServiceBase {
  constructor(repository: ClientsRepository = new ClientsRepository(db)) {
    super(repository);
  }
}

import { ConnectionRequestState } from '../enums/connection-request-state.enum';

export interface ConnectionRequest {
    id: number;
    requestEmail: string;
    ownerEmail: string;
    externalName: string;
    state: ConnectionRequestState;
}

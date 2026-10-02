import type { DAOAccessor } from "@/services/DAOAdapter"

export function createMockDAO(): jest.Mocked<DAOAccessor> {
    return {
        createSession: jest.fn(),
        createIncident: jest.fn(),
        createIncidentImage: jest.fn(),
    }
}

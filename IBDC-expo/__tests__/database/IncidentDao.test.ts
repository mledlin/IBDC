import {getDatabase} from "@/database/database";
import {
    getIncidentById,
    updateIncidentDetails,
} from "@/database/IncidentDao";

jest.mock("@/database/database", () => ({
    getDatabase: jest.fn(),
}));

type TestIncident = {
    id: string;
    injury: "Yes" | "No" | null;
    severity_of_pass: "Intent" | "Unaware" | null;
};

describe("incident selection persistence", () => {
    let rows: TestIncident[];
    let database: {
        runAsync: jest.Mock;
        getFirstAsync: jest.Mock;
    };

    beforeEach(() => {
        rows = [
            {id: "incident-1", injury: null, severity_of_pass: null},
            {id: "incident-2", injury: "No", severity_of_pass: "Unaware"},
        ];
        database = {
            runAsync: jest.fn(async (query: string, ...values: unknown[]) => {
                const columns = query
                    .replace("UPDATE incidents SET ", "")
                    .split(" WHERE ")[0]
                    .split(", ")
                    .map((assignment) => assignment.split(" = ")[0]);
                const incidentId = values[values.length - 1];
                const row = rows.find((item) => item.id === incidentId);
                if (row) {
                    columns.forEach((column, index) => {
                        if (column === "injury") {
                            row.injury = values[index] as "Yes" | "No" | null;
                        } else {
                            row.severity_of_pass = values[index] as
                                "Intent" | "Unaware" | null;
                        }
                    });
                }
            }),
            getFirstAsync: jest.fn(async (_query: string, incidentId: string) =>
                rows.find((row) => row.id === incidentId) ?? null,
            ),
        };
        (getDatabase as jest.Mock).mockResolvedValue(database);
    });

    test.each([
        ["Yes", "Intent"],
        ["Yes", "Unaware"],
        ["No", "Intent"],
        ["No", "Unaware"],
    ] as const)(
        "saves and reloads injury %s independently from severity of pass %s",
        async (injury, severityOfPass) => {
            await updateIncidentDetails("incident-1", {
                injury,
                severity_of_pass: severityOfPass,
            });

            await expect(getIncidentById("incident-1")).resolves.toEqual({
                id: "incident-1",
                injury,
                severity_of_pass: severityOfPass,
            });
            expect(await getIncidentById("incident-2")).toEqual({
                id: "incident-2",
                injury: "No",
                severity_of_pass: "Unaware",
            });
        },
    );

    test("updates existing selections without changing another incident", async () => {
        await updateIncidentDetails("incident-1", {
            injury: "Yes",
            severity_of_pass: "Intent",
        });
        await updateIncidentDetails("incident-1", {
            injury: "No",
            severity_of_pass: "Unaware",
        });

        await expect(getIncidentById("incident-1")).resolves.toEqual({
            id: "incident-1",
            injury: "No",
            severity_of_pass: "Unaware",
        });
        await expect(getIncidentById("incident-2")).resolves.toEqual({
            id: "incident-2",
            injury: "No",
            severity_of_pass: "Unaware",
        });
    });

    test("keeps unanswered selections null", async () => {
        await updateIncidentDetails("incident-1", {
            injury: null,
            severity_of_pass: null,
        });

        await expect(getIncidentById("incident-1")).resolves.toEqual({
            id: "incident-1",
            injury: null,
            severity_of_pass: null,
        });
    });
});

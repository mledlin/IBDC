import {buildRideSessionHtml} from "@/utils/SessionExport";

describe("session export incident selections", () => {
    test.each([
        ["Yes", "Intent"],
        ["Yes", "Unaware"],
        ["No", "Intent"],
        ["No", "Unaware"],
    ] as const)(
        "exports saved injury %s and severity of pass %s",
        (injury, severityOfPass) => {
            const html = buildRideSessionHtml({
                incidents: [{injury, severity_of_pass: severityOfPass}],
            });

            expect(html).toContain("<strong>Injury (Yes/No):</strong>");
            expect(html).toContain(`<span>${injury}</span>`);
            expect(html).toContain(
                "<strong>Severity of Pass (Intent/Unaware):</strong>",
            );
            expect(html).toContain(`<span>${severityOfPass}</span>`);
            expect(html).not.toContain("Injury Severity:");
        },
    );

    test("exports unanswered values explicitly and ignores legacy injury severity", () => {
        const html = buildRideSessionHtml({
            incidents: [{
                injury: null,
                severity_of_pass: null,
                injury_severity: "Severe",
            }],
        });

        expect(html).toContain("<strong>Injury (Yes/No):</strong>");
        expect(html).toContain(
            "<strong>Severity of Pass (Intent/Unaware):</strong>",
        );
        expect(html.match(/<span>Not provided<\/span>/g)).toHaveLength(3);
        expect(html).not.toContain("Severe");
    });
});

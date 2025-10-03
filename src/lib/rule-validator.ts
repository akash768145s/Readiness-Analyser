export interface RuleFinding {
    rule: string;
    ok: boolean;
    exampleLine?: number;
    expected?: number;
    got?: number;
    value?: string;
}

export type GenericRow = Record<string, unknown>;

export function validateRules(data: GenericRow[]): RuleFinding[] {
    const findings: RuleFinding[] = [];

    // Rule 1: TOTALS_BALANCE - total_excl_vat + vat_amount == total_incl_vat (±0.01)
    findings.push(validateTotalsBalance(data));

    // Rule 2: LINE_MATH - line_total == qty * unit_price (±0.01)
    findings.push(validateLineMath(data));

    // Rule 3: DATE_ISO - invoice.issue_date matches YYYY-MM-DD
    findings.push(validateDateISO(data));

    // Rule 4: CURRENCY_ALLOWED - currency ∈ [AED, SAR, MYR, USD]
    findings.push(validateCurrencyAllowed(data));

    // Rule 5: TRN_PRESENT - buyer.trn and seller.trn non-empty
    findings.push(validateTrnPresent(data));

    return findings;
}

function validateTotalsBalance(data: GenericRow[]): RuleFinding {
    let hasError = false;

    for (const row of data) {
        const totalExclVat = getNumericValue(row, ['total_excl_vat', 'totalNet', 'invoice.total_excl_vat']);
        const vatAmount = getNumericValue(row, ['vat_amount', 'vat', 'invoice.vat_amount']);
        const totalInclVat = getNumericValue(row, ['total_incl_vat', 'grandTotal', 'invoice.total_incl_vat']);

        if (totalExclVat !== null && vatAmount !== null && totalInclVat !== null) {
            const calculated = totalExclVat + vatAmount;
            if (Math.abs(calculated - totalInclVat) > 0.01) {
                hasError = true;
                break;
            }
        }
    }

    return {
        rule: 'TOTALS_BALANCE',
        ok: !hasError
    };
}

function validateLineMath(data: GenericRow[]): RuleFinding {
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const potentialLines = row['lines'];
        const lines: GenericRow[] = Array.isArray(potentialLines)
            ? (potentialLines.filter((l): l is GenericRow => typeof l === 'object' && l !== null))
            : [row]; // Handle both nested and flat structures

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const line = lines[lineIdx];
            const qty = getNumericValue(line, ['qty', 'lineQty', 'quantity']);
            const unitPrice = getNumericValue(line, ['unit_price', 'linePrice', 'price']);
            const lineTotal = getNumericValue(line, ['line_total', 'lineTotal', 'total']);

            if (qty !== null && unitPrice !== null && lineTotal !== null) {
                const calculated = qty * unitPrice;
                if (Math.abs(calculated - lineTotal) > 0.01) {
                    return {
                        rule: 'LINE_MATH',
                        ok: false,
                        exampleLine: i + 1,
                        expected: calculated,
                        got: lineTotal
                    };
                }
            }
        }
    }

    return {
        rule: 'LINE_MATH',
        ok: true
    };
}

function validateDateISO(data: GenericRow[]): RuleFinding {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    for (const row of data) {
        const issueDate = getStringValue(row, ['issue_date', 'date', 'issued_on', 'invoice.issue_date']);

        if (issueDate && !datePattern.test(issueDate)) {
            return {
                rule: 'DATE_ISO',
                ok: false,
                value: issueDate
            };
        }
    }

    return {
        rule: 'DATE_ISO',
        ok: true
    };
}

function validateCurrencyAllowed(data: GenericRow[]): RuleFinding {
    const allowedCurrencies = ['AED', 'SAR', 'MYR', 'USD'];

    for (const row of data) {
        const currency = getStringValue(row, ['currency', 'curr', 'invoice.currency']);

        if (currency && !allowedCurrencies.includes(currency.toUpperCase())) {
            return {
                rule: 'CURRENCY_ALLOWED',
                ok: false,
                value: currency
            };
        }
    }

    return {
        rule: 'CURRENCY_ALLOWED',
        ok: true
    };
}

function validateTrnPresent(data: GenericRow[]): RuleFinding {
    for (const row of data) {
        const sellerTrn = getStringValue(row, ['seller_trn', 'sellerTax', 'seller.trn']);
        const buyerTrn = getStringValue(row, ['buyer_trn', 'buyerTax', 'buyer.trn']);

        if (!sellerTrn || !buyerTrn || sellerTrn.trim() === '' || buyerTrn.trim() === '') {
            return {
                rule: 'TRN_PRESENT',
                ok: false
            };
        }
    }

    return {
        rule: 'TRN_PRESENT',
        ok: true
    };
}

// Helper function to get numeric value from multiple possible field names
function getNumericValue(obj: GenericRow, fieldNames: string[]): number | null {
    for (const fieldName of fieldNames) {
        const raw = obj && obj[fieldName as keyof typeof obj];
        if (raw !== undefined && raw !== null) {
            const num = Number(raw);
            if (!isNaN(num) && isFinite(num)) {
                return num;
            }
        }
    }
    return null;
}

// Helper function to get string value from multiple possible field names
function getStringValue(obj: GenericRow, fieldNames: string[]): string | null {
    for (const fieldName of fieldNames) {
        const raw = obj && obj[fieldName as keyof typeof obj];
        if (raw !== undefined && raw !== null) {
            return String(raw);
        }
    }
    return null;
}

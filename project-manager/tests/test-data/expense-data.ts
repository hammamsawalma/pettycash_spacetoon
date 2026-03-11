export type MonetaryTestInput = {
    scenario: string;
    amount: string; // Using string to simulate raw typed input
    expectedBehavior: 'success' | 'validation_error' | 'sanitized_success';
    expectedValue?: number; // The actual float saved to DB after sanitization
};

export const expenseAmountScenarios: MonetaryTestInput[] = [
    {
        scenario: 'Valid Standard Number',
        amount: '1500',
        expectedBehavior: 'success',
        expectedValue: 1500,
    },
    {
        scenario: 'Decimal Number',
        amount: '1500.75',
        expectedBehavior: 'success',
        expectedValue: 1500.75,
    },
    {
        scenario: 'Zero Value',
        amount: '0',
        expectedBehavior: 'validation_error',
    },
    {
        scenario: 'Negative Value',
        amount: '-500',
        expectedBehavior: 'validation_error',
    },
    {
        scenario: 'Extremely Large Number',
        amount: '999999999', // 999 Million
        expectedBehavior: 'validation_error',
    },
    {
        scenario: 'Invalid Characters (Letters)',
        amount: 'abc100', // Browsers usually block this in type="number", but good for API/UI fuzzing
        expectedBehavior: 'validation_error',
    }
];

let API = process.env.NEXT_PUBLIC_API_BASE_URL;

export const baseUrl = {
    ACCOUNTMASTER: `${API}accountmaster`,

    // STAFF
    STAFF: `${API}staff`,
    STAFF_DROPDOWN: `${API}staff/dropdown`,
    LOGIN: `${API}staff/login`,

    // ROLE
    ROLE: `${API}role`,
    ROLE_STATUSES: `${API}role/statuses`,

    // Inquiry
    INQUIRYCATEGORY: `${API}inquirycategory`,
    INQUIRYCATEGORY_DROPDOWN: `${API}inquirycategory/dropdown`,

    // Customization Type
    CUSTOMIZATIONTYPE: `${API}customizationtype`,
    CUSTOMIZATIONTYPE_DROPDOWN: `${API}customizationtype/dropdown`,

    // Client Type
    CLIENTTYPE: `${API}clienttype`,
    CLIENTTYPE_DROPDOWN: `${API}clienttype/dropdown`,

    // Source From
    SOURCEFROM: `${API}sourcefrom`,
    SOURCEFROM_DROPDOWN: `${API}sourcefrom/dropdown`,

    // Model
    MODEL_SUGGESTION: `${API}model`,
    MODEL_BY_CATEGORY: (categoryId: string) => `${API}model/category/${categoryId}`,
    
    // Color
    COLOR: `${API}color`,
    COLOR_DROPDOWN: `${API}color/dropdown`,
    
    // lead
    LEAD: `${API}lead`,
    DASHBOARD_STATS: `${API}lead/dashboard/stats`,
    DASHBOARD_GRAPHS: `${API}lead/dashboard/graphs`,

    // Reports
    REPORT_LEADS: `${API}report/leads`,
    REPORT_LEAD_ITEMS: `${API}report/lead-items`,
    REPORT_PAYMENTS: `${API}report/payments`,
    REPORT_FOLLOW_UPS: `${API}report/follow-ups`,
    REPORT_ACCOUNTS: `${API}report/accounts`,
    REPORT_STAFF_PERFORMANCE: `${API}report/staff-performance`,
    REPORT_SUMMARY: `${API}report/summary`,
}
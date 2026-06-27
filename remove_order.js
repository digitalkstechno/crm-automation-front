const fs = require('fs');
const path = require('path');

const files = [
    'lead-sources.tsx',
    'task-status.tsx',
    'lead-labels.tsx'
];

files.forEach(file => {
    const filePath = path.join('e:/manav/project/automation-crm/crm-automation-front/src/pages', file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove Yup order validation
    // Could be like `order: Yup.number()....max(9999),`
    content = content.replace(/order:\s*Yup\.number\(\)[\s\S]*?(?=});?)/, '');

    // Remove order from initialValues
    content = content.replace(/order:\s*\d+,?\s*/, '');

    // Remove order from payload
    content = content.replace(/,\s*order:\s*values\.order\s*/, '');

    // Remove FormInput for Order
    const inputRegex = /<FormInput[^>]*name="order"[^>]*>[\s\S]*?(?:<\/FormInput>|\/>)/;
    content = content.replace(inputRegex, '');

    // Remove order from formik.setValues inside onEdit
    content = content.replace(/order:\s*data\.order,?\s*/, '');

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Removed order inputs.');

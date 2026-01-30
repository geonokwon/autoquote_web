import axios from 'axios';

// --------------------------------------------------
// Axios instance
// --------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  withCredentials: true
});

// helper to unwrap { data }
const unwrap = (p) => p.then((res) => ({ data: res.data }));

// --------------------------------------------------
// Services
// --------------------------------------------------
export const fetchServices = () => unwrap(api.get('/services'));
export const addService = (data) => unwrap(api.post('/services', data));
export const updateService = (id, data) => unwrap(api.put(`/services/${id}`, data));
export const deleteService = (id) => unwrap(api.delete(`/services/${id}`));
export const updateServiceOptionName = (serviceId, oldLabel, newLabel) => 
  unwrap(api.put(`/services/${serviceId}/update-option-name`, { oldLabel, newLabel }));

// --------------------------------------------------
// Combo Rules (monthly 할인)
// --------------------------------------------------
export const fetchComboRules = () => unwrap(api.get('/combo-rules'));
export const addComboRule = (data) => unwrap(api.post('/combo-rules', data));
export const updateComboRule = (id, data) => unwrap(api.put(`/combo-rules/${id}`, data));
export const deleteComboRule = (id) => unwrap(api.delete(`/combo-rules/${id}`));

// --------------------------------------------------
// Product Benefits (상품별 기본 혜택)
// --------------------------------------------------
export const fetchProductBenefits = () => unwrap(api.get('/product-benefits'));
export const addProductBenefit = (data) => unwrap(api.post('/product-benefits', data));
export const updateProductBenefit = (id, data) => unwrap(api.put(`/product-benefits/${id}`, data));
export const deleteProductBenefit = (id) => unwrap(api.delete(`/product-benefits/${id}`));

// --------------------------------------------------
// Benefit Rules (결합 혜택)
// --------------------------------------------------
export const fetchBenefitRules = () => unwrap(api.get('/benefit-rules'));
export const addBenefitRule = (data) => unwrap(api.post('/benefit-rules', data));
export const updateBenefitRule = (id, data) => unwrap(api.put(`/benefit-rules/${id}`, data));
export const deleteBenefitRule = (id) => unwrap(api.delete(`/benefit-rules/${id}`));

// --------------------------------------------------
// (Optional) Benefits 별도 관리 필요 시 활성화
// --------------------------------------------------
export const fetchBenefits = () => unwrap(api.get('/benefits'));
export const addBenefit = (data) => unwrap(api.post('/benefits', data));
export const updateBenefit = (id, data) => unwrap(api.put(`/benefits/${id}`, data));
export const deleteBenefit = (id) => unwrap(api.delete(`/benefits/${id}`));

// --------------------------------------------------
// Memo
// --------------------------------------------------
export const fetchMemo = () => unwrap(api.get('/memo'));
export const updateMemo = (obj) => unwrap(api.put('/memo', obj));

// --------------------------------------------------
// Quotes (Estimates)
// --------------------------------------------------
export const fetchQuotes = () => unwrap(api.get('/quotes'));
export const fetchQuote = (fileName) => unwrap(api.get(`/quotes/${fileName}`));
export const saveQuote = (data) => unwrap(api.post('/quotes', data));
export const deleteQuote = (fileName) => unwrap(api.delete(`/quotes/${fileName}`));

// --------------------------------------------------
// Bundle Benefits (묶음 혜택 표시용)
// --------------------------------------------------
export const fetchBundleBenefits = () => unwrap(api.get('/bundle-benefits'));
export const addBundleBenefit = (data) => unwrap(api.post('/bundle-benefits', data));
export const updateBundleBenefit = (id, data) => unwrap(api.put(`/bundle-benefits/${id}`, data));
export const deleteBundleBenefit = (id) => unwrap(api.delete(`/bundle-benefits/${id}`));

// --------------------------------------------------
// Groups (service grouping metadata)
// --------------------------------------------------
export const fetchGroups = () => unwrap(api.get('/groups'));
export const addGroup = (data) => unwrap(api.post('/groups', data));
export const updateGroup = (id, data) => unwrap(api.put(`/groups/${id}`, data));
export const deleteGroup = (id) => unwrap(api.delete(`/groups/${id}`));

// default export for direct axios calls (e.g., login)
export default api; 
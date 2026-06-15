const config = require('./mapping-config.json');

class AutoMapper {
  constructor() {
    this.rules = config.autoMappingRules;
    this.sources = config.sources;
  }

  // تعيين حقل واحد تلقائيًا
  autoMapField(fieldName, value) {
    for (const rule of this.rules) {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(fieldName)) {
        return { target: rule.target, value };
      }
    }
    return null;
  }

  // تعيين كل البيانات من مصدر معين
  mapSource(data, sourceName) {
    const result = {};
    const sourceConfig = this.sources[sourceName];
    
    if (sourceConfig?.fieldMappings) {
      for (const [sourceField, targetField] of Object.entries(sourceConfig.fieldMappings)) {
        if (data[sourceField] !== undefined) {
          result[targetField] = data[sourceField];
        }
      }
    }
    
    // Auto-mapping للحقول الغير معرفة
    for (const [key, value] of Object.entries(data)) {
      if (!result.hasOwnProperty(key) && !sourceConfig?.ignoreFields?.includes(key)) {
        const mapped = this.autoMapField(key, value);
        if (mapped) {
          result[mapped.target] = mapped.value;
        }
      }
    }
    
    return result;
  }

  // تطبيق التحويلات المخصصة (مثل استخراج market price من array)
  applyTransform(data, sourceName) {
    const sourceConfig = this.sources[sourceName];
    if (!sourceConfig?.transform) return data;
    
    const transformed = { ...data };
    for (const [targetField, expression] of Object.entries(sourceConfig.transform)) {
      try {
        // تقييم التعبير بأمان (في الإنتاج استخدم vm أو JSONPath)
        const fn = new Function('data', `return (${expression})`);
        const value = fn(data);
        if (value !== undefined) {
          transformed[targetField] = value;
        }
      } catch (e) {
        console.warn(`Transform failed for ${targetField}:`, e.message);
      }
    }
    return transformed;
  }

  // دمج بيانات من عدة مصادر
  merge(sourcesData) {
    const merged = {};
    for (const data of sourcesData) {
      Object.assign(merged, data);
    }
    
    // إضافة timestamp
    merged.lastUpdated = new Date().toISOString();
    
    return merged;
  }
}

module.exports = AutoMapper;
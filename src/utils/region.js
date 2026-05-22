import regionData from 'china-area-data'

/**
 * 构建省市区 Cascader 选项树
 * value 存行政区划代码（code），name/label 存名称
 * 配合 :field-names="{ label: 'label', value: 'name', children: 'children' }" 使用时，
 * Cascader 的 v-model 会是名称数组，方便编辑回填；提交时从 selectedOptions[i].value 取 code
 * @returns {Array}
 */
export function buildRegionOptions() {
  const provinces = regionData['86'] || {}
  return Object.entries(provinces).map(([provinceCode, provinceName]) => {
    const cities = regionData[provinceCode] || {}
    const children = Object.entries(cities).map(([cityCode, cityName]) => {
      const districts = regionData[cityCode] || {}
      const districtChildren = Object.entries(districts).map(([districtCode, districtName]) => ({
        value: districtCode,
        label: districtName,
        name: districtName
      }))
      return {
        value: cityCode,
        label: cityName,
        name: cityName,
        children: districtChildren.length > 0 ? districtChildren : undefined
      }
    })
    return {
      value: provinceCode,
      label: provinceName,
      name: provinceName,
      children: children.length > 0 ? children : undefined
    }
  })
}

/**
 * 根据省市区名称在选项树中找到对应的选项对象数组
 * 用于编辑时初始化 formRegionSelected（可从中取 value=code 和 name）
 * @param {Array} options - buildRegionOptions() 的返回值
 * @param {string} province
 * @param {string} city
 * @param {string} district
 * @returns {Array} 匹配到的选项对象数组
 */
export function findRegionOptions(options, province, city, district) {
  if (!province) return []
  const provOpt = options.find((o) => o.name === province)
  if (!provOpt) return []
  const result = [provOpt]
  if (!city) return result
  const cityOpt = (provOpt.children || []).find((o) => o.name === city)
  if (!cityOpt) return result
  result.push(cityOpt)
  if (!district) return result
  const distOpt = (cityOpt.children || []).find((o) => o.name === district)
  if (distOpt) result.push(distOpt)
  return result
}

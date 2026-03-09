import { ErrorCode } from './error-codes';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.TEXT_TRANSLATE_CONFIG_MISSING]: '请先在设置中完成文本翻译配置',
  [ErrorCode.SCREENSHOT_DIRECT_CONFIG_MISSING]: '请先在设置中完成截图直译配置',
  [ErrorCode.SCREENSHOT_EXTRACT_CONFIG_MISSING]: '请先在设置中完成截图提取配置',
  [ErrorCode.SCREENSHOT_TRANSLATE_CONFIG_MISSING]: '请先在设置中完成截图翻译配置',

  [ErrorCode.TEXT_TRANSLATE_PERMISSION_DENIED]: '请先授权访问文本翻译服务地址',
  [ErrorCode.SCREENSHOT_DIRECT_PERMISSION_DENIED]: '请先授权访问截图直译服务地址',
  [ErrorCode.SCREENSHOT_EXTRACT_PERMISSION_DENIED]: '请先授权访问截图提取服务地址',
  [ErrorCode.SCREENSHOT_TRANSLATE_PERMISSION_DENIED]: '请先授权访问截图翻译服务地址',

  [ErrorCode.TEXT_API_KEY_MISSING]: '文本翻译 API Key 未配置',
  [ErrorCode.SCREENSHOT_DIRECT_API_KEY_MISSING]: '截图直译 API Key 未配置',
  [ErrorCode.SCREENSHOT_EXTRACT_API_KEY_MISSING]: '截图提取 API Key 未配置',
  [ErrorCode.SCREENSHOT_TRANSLATE_API_KEY_MISSING]: '截图翻译 API Key 未配置',
  [ErrorCode.TEXT_MODEL_MISSING]: '文本翻译模型未配置',
  [ErrorCode.VISION_MODEL_MISSING]: '视觉模型未配置',

  [ErrorCode.INVALID_INPUT]: '输入内容无效',
  [ErrorCode.TEXT_TOO_LONG]: '文本过长，请缩短后重试',
  [ErrorCode.IMAGE_TOO_LARGE]: '截图区域过大，请缩小后重试',
  [ErrorCode.SCREENSHOT_REGION_INVALID]: '选择区域过小，请重新框选',

  [ErrorCode.SCREENSHOT_CAPTURE_FAILED]: '当前页面截图失败，请重试',
  [ErrorCode.VISION_MODEL_UNSUPPORTED]: '当前模型不支持截图翻译',
  [ErrorCode.UPSTREAM_TIMEOUT]: '请求超时，请检查网络后重试',
  [ErrorCode.UPSTREAM_BAD_RESPONSE]: '服务返回异常，请检查模型配置',
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorCode.INTERNAL_ERROR]: '服务暂时不可用，请稍后重试',
};

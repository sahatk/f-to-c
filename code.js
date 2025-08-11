// SCSS 텍스트에서 클래스명 추출
function extractClassNamesFromScss(scss) {
  const set = new Set();
  if (!scss) return [];
  const str = String(scss);
  const re = /\.([a-zA-Z][a-zA-Z0-9_-]*)\b/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m[1]) set.add(m[1]);
  }
  return Array.from(set).sort();
}

// HTML에서 클래스명 추출
function extractClassNamesFromHtml(html) {
  const set = new Set();
  if (!html) return [];
  const str = String(html);
  const re = /class\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m[1]) {
      const classes = m[1].split(/\s+/).filter(Boolean);
      classes.forEach((cls) => set.add(cls));
    }
  }
  return Array.from(set).sort();
}

// MCP 데이터에서 HTML 구조 분석 및 추천
function analyzeMcpForHtmlStructure(mcpJson) {
  const analysis = {
    semanticTags: [],
    componentTypes: [],
    listStructures: [],
    textElements: [],
    buttonElements: [],
    imageElements: [],
    recommendedStructure: "",
  };

  function analyzeNode(node, depth = 0) {
    if (!node) return;

    const nodeName = (node.name || "").toLowerCase();
    const nodeType = node.type;

    if (nodeType === "TEXT" && node.text) {
      const textLength = node.text.length;
      const isTitle =
        textLength < 50 &&
        (nodeName.includes("title") ||
          nodeName.includes("heading") ||
          nodeName.includes("header") ||
          node.fontSize > 20);

      analysis.textElements.push({
        text: node.text,
        isTitle,
        fontSize: node.fontSize,
        recommendedTag: isTitle ? `h${Math.min(depth + 1, 6)}` : "p",
      });
    }

    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      const hasRepeatingStructure =
        childCount > 2 &&
        node.children.every((child, index) => {
          if (index === 0) return true;
          return child.type === node.children[0].type;
        });

      if (hasRepeatingStructure) {
        analysis.listStructures.push({
          parentName: node.name,
          itemCount: childCount,
          recommendedTag: "ul/li",
        });
      }

      if (depth === 0) {
        if (nodeName.includes("header") || nodeName.includes("top")) {
          analysis.semanticTags.push("header");
        } else if (nodeName.includes("nav") || nodeName.includes("menu")) {
          analysis.semanticTags.push("nav");
        } else if (nodeName.includes("main") || nodeName.includes("content")) {
          analysis.semanticTags.push("main");
        } else if (nodeName.includes("footer") || nodeName.includes("bottom")) {
          analysis.semanticTags.push("footer");
        } else if (nodeName.includes("sidebar") || nodeName.includes("aside")) {
          analysis.semanticTags.push("aside");
        } else {
          analysis.semanticTags.push("section");
        }
      }

      if (nodeName.includes("button") || nodeName.includes("btn")) {
        analysis.componentTypes.push("component-btns");
        analysis.buttonElements.push({
          name: node.name,
          recommendedTag: "button",
        });
      } else if (nodeName.includes("input") || nodeName.includes("form")) {
        analysis.componentTypes.push("component-input");
      } else if (nodeName.includes("tab")) {
        analysis.componentTypes.push("component-tab");
      } else if (nodeName.includes("table")) {
        analysis.componentTypes.push("component-table");
      }

      node.children.forEach((child) => analyzeNode(child, depth + 1));
    }

    if (
      nodeType === "RECTANGLE" ||
      nodeType === "ELLIPSE" ||
      nodeName.includes("image") ||
      nodeName.includes("img") ||
      nodeName.includes("photo") ||
      nodeName.includes("picture")
    ) {
      analysis.imageElements.push({
        name: node.name,
        size: node.size,
        recommendedTag: "figure/img",
      });
    }
  }

  if (mcpJson && mcpJson.selection) {
    mcpJson.selection.forEach((node) => analyzeNode(node));
  }

  analysis.recommendedStructure = generateRecommendedStructure(analysis);

  return analysis;
}

// 분석 결과를 바탕으로 추천 HTML 구조 생성
function generateRecommendedStructure(analysis) {
  const hasHeader = analysis.semanticTags.includes("header");
  const hasNav = analysis.semanticTags.includes("nav");
  const hasMain = analysis.semanticTags.includes("main");
  const hasFooter = analysis.semanticTags.includes("footer");
  const hasLists = analysis.listStructures.length > 0;
  const hasComponents = analysis.componentTypes.length > 0;

  let structure = "추천 HTML 구조:\n";

  if (hasHeader) structure += "- <header> 태그로 상단 영역 구성\n";
  if (hasNav) structure += "- <nav> 태그로 네비게이션 구성\n";
  if (hasMain) structure += "- <main> 태그로 주요 콘텐츠 구성\n";
  else structure += "- <section> 태그로 콘텐츠 섹션 구성\n";

  if (analysis.textElements.length > 0) {
    const titles = analysis.textElements.filter((t) => t.isTitle);
    if (titles.length > 0) {
      structure += `- 제목 요소: ${titles
        .map((t) => t.recommendedTag)
        .join(", ")}\n`;
    }
  }

  if (hasLists) {
    structure += `- 리스트 구조: ${analysis.listStructures.length}개의 ul/li 구조\n`;
  }

  if (hasComponents) {
    structure += `- 컴포넌트: ${[...new Set(analysis.componentTypes)].join(
      ", "
    )}\n`;
  }

  if (analysis.imageElements.length > 0) {
    structure += `- 이미지: ${analysis.imageElements.length}개의 figure/img 구조\n`;
  }

  if (hasFooter) structure += "- <footer> 태그로 하단 영역 구성\n";

  return structure;
}

// MCP → HTML 프롬프트 생성 (분석 결과 포함)
function buildEnhancedHtmlPromptFromMcp(mcpJson, userPrompt) {
  const analysis = analyzeMcpForHtmlStructure(mcpJson);
  const header = userPrompt ? String(userPrompt).trim() + "\n\n" : "";

  const guidelines = [
    "당신은 피그마 MCP JSON을 기반으로 HTML 코딩 가이드라인에 완벽히 준수하는 HTML을 생성하는 도우미입니다.",
    "반드시 순수 HTML만 반환하세요. 코드펜스(```), 마크다운, 설명 텍스트는 금지입니다.",
    "",
    "== 분석된 구조 정보 ==",
    analysis.recommendedStructure,
    "",
    "== HTML 코딩 가이드라인 필수 준수사항 ==",
    "",
    "1. 시맨틱 태그 사용:",
    "   - <header>: 페이지/섹션 헤더",
    "   - <nav>: 네비게이션 메뉴",
    "   - <main>: 페이지 주요 콘텐츠 (하나만)",
    "   - <section>: 독립적인 섹션",
    "   - <article>: 독립적 콘텐츠",
    "   - <aside>: 사이드바",
    "   - <footer>: 푸터",
    "",
    "2. 클래스 네이밍 (케밥 케이스 필수):",
    "   - main-container, benefit-item, content-section",
    "",
    "3. 헤딩 태그 계층적 사용:",
    "   - h1: 페이지 최상위 제목 (하나만)",
    "   - h2, h3, h4, h5, h6: 순차적 계층",
    "",
    "4. 리스트 구조 (반복 아이템):",
    "   - <ul><li> 구조 필수 사용",
    "",
    "5. 링크와 버튼:",
    "   - 링크: <a href=''>",
    "   - 버튼: <button type='button'>",
    "",
    "6. 아이콘:",
    "   - <i class='ico-아이콘명 ico-normal' aria-hidden='true'></i>",
    "",
    "7. 컴포넌트 구조:",
    analysis.componentTypes.length > 0
      ? `   - 감지된 컴포넌트: ${[...new Set(analysis.componentTypes)].join(
          ", "
        )}`
      : "   - 적절한 component- 클래스 사용",
    "",
    "8. 접근성:",
    "   - aria-label, aria-hidden, role 속성",
    "   - 구조 주석: <!-- 섹션명 시작 -->",
  ];

  const jsonText = safeStringify(mcpJson);
  return (
    header +
    guidelines.join("\n") +
    "\n\n[MCP_SELECTION_JSON]\n" +
    jsonText +
    "\n[/MCP_SELECTION_JSON]"
  );
}

// HTML 코드 후처리 (가이드라인 준수 확인 및 수정)
function postProcessHtmlCode(html) {
  if (!html) return html;

  let processedHtml = String(html);

  processedHtml = processedHtml.replace(
    /class\s*=\s*["']([^"']+)["']/g,
    (match, classes) => {
      const fixedClasses = classes
        .split(/\s+/)
        .map((cls) => convertToKebabCase(cls))
        .join(" ");
      return `class="${fixedClasses}"`;
    }
  );

  processedHtml = processedHtml.replace(
    /<a\s+([^>]*?)href\s*=\s*["'][^"']*["']/g,
    (match, beforeHref) => {
      if (match.includes('href=""')) return match;
      return `<a ${beforeHref}href=""`;
    }
  );

  processedHtml = processedHtml.replace(
    /<i\s+class\s*=\s*["']([^"']*icon[^"']*)["']/g,
    (match, iconClass) => {
      if (iconClass.includes("ico-") && iconClass.includes("ico-normal")) {
        return match;
      }
      const standardIcon = iconClass.includes("ico-")
        ? iconClass + " ico-normal"
        : "ico-default ico-normal";
      return `<i class="${standardIcon}"`;
    }
  );

  processedHtml = processedHtml.replace(
    /<button(?!\s+[^>]*type\s*=)/g,
    '<button type="button"'
  );

  processedHtml = processedHtml.replace(
    /<i\s+class\s*=\s*["'][^"']*ico-[^"']*["'](?![^>]*aria-hidden)/g,
    (match) => {
      return match.replace(">", ' aria-hidden="true">');
    }
  );

  processedHtml = improveLiTiStructure(processedHtml);
  processedHtml = validateHeadingHierarchy(processedHtml);

  return processedHtml;
}

// 케밥 케이스 변환 함수
function convertToKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/--+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
}

// 리스트 구조 개선 함수
function improveLiTiStructure(html) {
  return html.replace(
    /(<div[^>]*class\s*=\s*["'][^"']*item[^"']*["'][^>]*>[\s\S]*?<\/div>\s*){2,}/g,
    (match) => {
      const items = match.match(
        /<div[^>]*class\s*=\s*["'][^"']*item[^"']*["'][^>]*>[\s\S]*?<\/div>/g
      );
      if (items && items.length > 1) {
        const listItems = items
          .map((item) =>
            item.replace(/^<div/, "<li").replace(/<\/div>$/, "</li>")
          )
          .join("\n    ");
        return `<ul>\n    ${listItems}\n</ul>`;
      }
      return match;
    }
  );
}

// 헤딩 태그 계층 검증 함수
function validateHeadingHierarchy(html) {
  let h1Count = 0;
  return html.replace(/<h([1-6])([^>]*)>/g, (match, level, attrs) => {
    const currentLevel = parseInt(level);
    if (currentLevel === 1) {
      h1Count++;
      if (h1Count > 1) {
        return `<h2${attrs}>`;
      }
    }
    return match;
  });
}

// HTML 구조를 SCSS 생성을 위해 분석하는 함수
function analyzeHtmlStructureForScss(html) {
  const analysis = {
    wrapperClass: "",
    allClasses: [],
    semanticTags: [],
    componentClasses: [],
    interactiveElements: [],
    listStructures: [],
    iconElements: [],
  };

  if (!html) return analysis;

  analysis.allClasses = extractClassNamesFromHtml(html);

  const firstTagMatch = html.match(
    /<([a-zA-Z][a-zA-Z0-9-]*)[^>]*class\s*=\s*["']([^"']+)["']/
  );
  if (firstTagMatch && firstTagMatch[2]) {
    const firstClasses = firstTagMatch[2].split(/\s+/).filter(Boolean);
    analysis.wrapperClass = firstClasses[0] || "";
  }

  const semanticRegex =
    /<(header|nav|main|section|article|aside|footer|figure)[^>]*>/g;
  let semanticMatch;
  while ((semanticMatch = semanticRegex.exec(html)) !== null) {
    if (!analysis.semanticTags.includes(semanticMatch[1])) {
      analysis.semanticTags.push(semanticMatch[1]);
    }
  }

  analysis.componentClasses = analysis.allClasses.filter((cls) =>
    cls.startsWith("component-")
  );

  const buttonRegex = /<button[^>]*class\s*=\s*["']([^"']+)["'][^>]*>/g;
  const linkRegex = /<a[^>]*class\s*=\s*["']([^"']+)["'][^>]*>/g;

  let interactiveMatch;
  while ((interactiveMatch = buttonRegex.exec(html)) !== null) {
    analysis.interactiveElements.push({
      type: "button",
      classes: interactiveMatch[1].split(/\s+/).filter(Boolean),
    });
  }

  while ((interactiveMatch = linkRegex.exec(html)) !== null) {
    analysis.interactiveElements.push({
      type: "link",
      classes: interactiveMatch[1].split(/\s+/).filter(Boolean),
    });
  }

  const listRegex = /<ul[^>]*class\s*=\s*["']([^"']+)["'][^>]*>/g;
  let listMatch;
  while ((listMatch = listRegex.exec(html)) !== null) {
    analysis.listStructures.push({
      classes: listMatch[1].split(/\s+/).filter(Boolean),
    });
  }

  const iconRegex = /<i[^>]*class\s*=\s*["']([^"']*ico-[^"']*)["'][^>]*>/g;
  let iconMatch;
  while ((iconMatch = iconRegex.exec(html)) !== null) {
    analysis.iconElements.push({
      classes: iconMatch[1].split(/\s+/).filter(Boolean),
    });
  }

  return analysis;
}

// SCSS 분석 결과를 텍스트로 생성하는 함수
function generateScssAnalysisText(htmlAnalysis, mcpStyleInfo) {
  let analysisText = "";

  if (htmlAnalysis.wrapperClass) {
    analysisText += `최상위 래퍼 클래스: .${htmlAnalysis.wrapperClass}\n`;
  }

  if (htmlAnalysis.semanticTags.length > 0) {
    analysisText += `시맨틱 태그: ${htmlAnalysis.semanticTags.join(", ")}\n`;
  }

  if (htmlAnalysis.componentClasses.length > 0) {
    analysisText += `컴포넌트 클래스: ${htmlAnalysis.componentClasses.join(
      ", "
    )}\n`;
  }

  if (htmlAnalysis.interactiveElements.length > 0) {
    analysisText += `인터랙티브 요소: ${htmlAnalysis.interactiveElements.length}개 (버튼, 링크)\n`;
  }

  if (htmlAnalysis.listStructures.length > 0) {
    analysisText += `리스트 구조: ${htmlAnalysis.listStructures.length}개의 ul/li\n`;
  }

  if (htmlAnalysis.iconElements.length > 0) {
    analysisText += `아이콘 요소: ${htmlAnalysis.iconElements.length}개\n`;
  }

  if (mcpStyleInfo.colors && mcpStyleInfo.colors.length > 0) {
    analysisText += `MCP 색상 정보: ${mcpStyleInfo.colors
      .slice(0, 3)
      .join(", ")}${mcpStyleInfo.colors.length > 3 ? " 등" : ""}\n`;
  }

  if (mcpStyleInfo.fonts && mcpStyleInfo.fonts.length > 0) {
    analysisText += `MCP 폰트 정보: ${mcpStyleInfo.fonts.join(", ")}\n`;
  }

  analysisText += `총 클래스 수: ${htmlAnalysis.allClasses.length}개\n`;

  return analysisText;
}

// SCSS 코드 후처리 (가이드라인 완벽 준수)
function postProcessScssCode(scss) {
  if (!scss) return scss;

  let processedScss = String(scss);

  // 1. rem() 함수 형식을 @include rem() 믹스인으로 변환
  processedScss = processedScss.replace(
    /(\s+)([a-zA-Z-]+)\s*:\s*rem\(([^)]+)\)\s*;/g,
    (match, indent, property, value) => {
      // px 단위 제거하고 숫자만 추출
      const cleanValue = value.replace(/px/g, "").trim();
      return `${indent}@include rem(${property}, ${cleanValue});`;
    }
  );

  // 2. 모든 수치 속성을 @include rem() 믹스인으로 변환
  const numericProperties = [
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "width",
    "height",
    "max-width",
    "min-width",
    "max-height",
    "min-height",
    "top",
    "right",
    "bottom",
    "left",
    "font-size",
    "line-height",
    "border-width",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "border-radius",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "gap",
    "row-gap",
    "column-gap",
    "outline-width",
    "outline-offset",
    "text-indent",
    "letter-spacing",
    "word-spacing",
    "transform-origin",
    "perspective",
    "perspective-origin",
  ];

  // 각 속성별로 개별 처리
  numericProperties.forEach((prop) => {
    // 이미 @include rem() 형식인 경우는 건드리지 않음
    const regex = new RegExp(
      `(\\s+)(${escapeRegExp(prop)})\\s*:\\s*([^;]+);`,
      "g"
    );

    processedScss = processedScss.replace(
      regex,
      (match, indent, property, value) => {
        // 이미 @include rem() 형식이면 패스
        if (match.includes("@include rem(")) return match;

        // calc() 함수가 포함된 경우 패스
        if (value.includes("calc(")) return match;

        // 키워드 값들은 패스 (auto, inherit, initial, unset, none, 등)
        const keywordValues =
          /^(auto|inherit|initial|unset|none|normal|baseline|center|flex-start|flex-end|space-between|space-around|space-evenly|stretch|start|end|left|right|top|bottom|middle|text-top|text-bottom|sub|super|0)$/i;
        if (keywordValues.test(value.trim())) return match;

        // 백분율 값은 패스
        if (value.includes("%")) return match;

        // viewport 단위는 패스 (vw, vh, vmin, vmax)
        if (/\d+(vw|vh|vmin|vmax)/i.test(value)) return match;

        // em, rem 단위는 패스
        if (/\d+(em|rem)/i.test(value)) return match;

        // 수치 값 처리
        const processedValue = processNumericValue(value.trim());
        if (processedValue) {
          return `${indent}@include rem(${property}, ${processedValue});`;
        }

        return match;
      }
    );
  });

  // 3. border 속성 특별 처리
  const borderRegex =
    /(\\s+)(border(?:-(?:top|right|bottom|left))?)\\s*:\\s*([^;]+);/g;
  processedScss = processedScss.replace(
    borderRegex,
    (match, indent, property, value) => {
      if (match.includes("@include rem(")) return match;
      if (value.includes("calc(")) return match;

      // border: none, border: 0 등은 패스
      if (/^(none|0)$/i.test(value.trim())) return match;

      const processedValue = processBorderValue(value.trim());
      if (processedValue) {
        return `${indent}@include rem(${property}, ${processedValue});`;
      }

      return match;
    }
  );

  // 4. box-shadow 속성 처리
  const shadowRegex = /(\\s+)(box-shadow|text-shadow)\\s*:\\s*([^;]+);/g;
  processedScss = processedScss.replace(
    shadowRegex,
    (match, indent, property, value) => {
      if (match.includes("@include rem(")) return match;
      if (value.includes("calc(")) return match;
      if (value.trim() === "none") return match;

      const processedValue = processShadowValue(value.trim());
      if (processedValue) {
        return `${indent}@include rem(${property}, ${processedValue});`;
      }

      return match;
    }
  );

  // 5. 색상 변수를 직접 hex 값으로 변환
  const colorVariableRegex = /\\$[a-zA-Z][a-zA-Z0-9_-]*/g;
  processedScss = processedScss.replace(colorVariableRegex, (match) => {
    // 일반적인 색상 변수명을 hex 값으로 매핑
    const colorMap = {
      $primary: "#3b82f6",
      "$primary-bg": "#3b82f6",
      "$color-primary": "#3b82f6",
      $white: "#ffffff",
      "$color-white": "#ffffff",
      "$color-fff": "#ffffff",
      $black: "#000000",
      "$color-black": "#000000",
      "$color-000": "#000000",
      $gray: "#6b7280",
      $grey: "#6b7280",
      "$color-gray": "#6b7280",
      "$color-grey": "#6b7280",
      "$light-gray": "#f3f4f6",
      "$light-grey": "#f3f4f6",
      "$dark-gray": "#374151",
      "$dark-grey": "#374151",
      $red: "#ef4444",
      "$color-red": "#ef4444",
      $green: "#10b981",
      "$color-green": "#10b981",
      $blue: "#3b82f6",
      "$color-blue": "#3b82f6",
      $yellow: "#f59e0b",
      "$color-yellow": "#f59e0b",
      $orange: "#f97316",
      "$color-orange": "#f97316",
      $purple: "#8b5cf6",
      "$color-purple": "#8b5cf6",
      $pink: "#ec4899",
      "$color-pink": "#ec4899",
      $success: "#10b981",
      $error: "#ef4444",
      $warning: "#f59e0b",
      $info: "#3b82f6",
      $danger: "#ef4444",
    };

    const lowerMatch = match.toLowerCase();
    for (const [variable, hex] of Object.entries(colorMap)) {
      if (lowerMatch === variable.toLowerCase()) {
        return hex;
      }
    }

    // 매핑되지 않은 변수는 기본 색상으로
    if (lowerMatch.includes("white") || lowerMatch.includes("fff"))
      return "#ffffff";
    if (lowerMatch.includes("black") || lowerMatch.includes("000"))
      return "#000000";
    if (lowerMatch.includes("primary") || lowerMatch.includes("blue"))
      return "#3b82f6";
    if (lowerMatch.includes("gray") || lowerMatch.includes("grey"))
      return "#6b7280";
    if (lowerMatch.includes("red") || lowerMatch.includes("danger"))
      return "#ef4444";
    if (lowerMatch.includes("green") || lowerMatch.includes("success"))
      return "#10b981";

    // 기본값
    return "#cccccc";
  });

  // 6. 중첩 깊이 확인 및 경고
  const lines = processedScss.split("\n");
  let nestingDepth = 0;
  const maxNestingDepth = 4;

  lines.forEach((line, index) => {
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    nestingDepth += openBraces - closeBraces;

    if (nestingDepth > maxNestingDepth) {
      lines[index] =
        line + ` /* WARNING: 중첩 깊이 초과 (${maxNestingDepth}단계 제한) */`;
    }
  });

  return lines.join("\n");
}

// 수치 값 처리 함수
function processNumericValue(value) {
  // 여러 값이 공백으로 구분된 경우 (예: "10px 20px 15px")
  if (value.includes(" ")) {
    const values = value
      .split(/\\s+/)
      .map((v) => v.replace(/px$/i, ""))
      .filter((v) => v && /^\\d+(\\.\\d+)?$/.test(v));

    if (values.length > 0) {
      return values.join(" ");
    }
  }

  // 단일 수치 값 (예: "24px")
  const numericMatch = value.match(/^(\\d+(?:\\.\\d+)?)px?$/i);
  if (numericMatch) {
    return numericMatch[1];
  }

  return null;
}

// border 값 처리 함수
function processBorderValue(value) {
  // border: 1px solid #333 형태 처리
  const borderMatch = value.match(
    /^(\\d+(?:\\.\\d+)?)px?\\s+(solid|dashed|dotted|double|groove|ridge|inset|outset)\\s+(#[0-9a-fA-F]{3,6}|[a-zA-Z]+|rgb\\([^)]+\\)|rgba\\([^)]+\\))$/i
  );
  if (borderMatch) {
    return `${borderMatch[1]} ${borderMatch[2]} ${borderMatch[3]}`;
  }

  // border-width만 있는 경우
  const widthMatch = value.match(/^(\\d+(?:\\.\\d+)?)px?$/i);
  if (widthMatch) {
    return widthMatch[1];
  }

  return null;
}

// shadow 값 처리 함수
function processShadowValue(value) {
  // box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.25) 형태 처리
  const shadowMatch = value.match(
    /^(\\d+(?:\\.\\d+)?)px?\\s+(\\d+(?:\\.\\d+)?)px?\\s+(\\d+(?:\\.\\d+)?)px?\\s+(\\d+(?:\\.\\d+)?)px?\\s+(.+)$/i
  );
  if (shadowMatch) {
    return `${shadowMatch[1]} ${shadowMatch[2]} ${shadowMatch[3]} ${shadowMatch[4]} ${shadowMatch[5]}`;
  }

  // 3개 값: x y blur color
  const shadowMatch3 = value.match(
    /^(\\d+(?:\\.\\d+)?)px?\\s+(\\d+(?:\\.\\d+)?)px?\\s+(\\d+(?:\\.\\d+)?)px?\\s+(.+)$/i
  );
  if (shadowMatch3) {
    return `${shadowMatch3[1]} ${shadowMatch3[2]} ${shadowMatch3[3]} ${shadowMatch3[4]}`;
  }

  return null;
}

// 정규식 이스케이프 함수
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
}

// 향상된 SCSS 프롬프트 생성 (가이드라인 완벽 준수 강조)
function buildEnhancedScssPromptFromHtmlAndMcp(htmlCode, mcpJson, userPrompt) {
  const header = userPrompt ? String(userPrompt).trim() + "\n\n" : "";
  const guidelines = [
    "당신은 HTML 구조와 피그마 MCP JSON을 분석하여 SCSS 코딩 가이드라인에 완벽히 준수하는 SCSS를 생성하는 도우미입니다.",
    "반드시 순수 SCSS만 반환하세요. 코드펜스(```), 마크다운, 설명 텍스트는 금지입니다.",
    "",
    "== SCSS 코딩 가이드라인 필수 준수사항 (★★★★★ 중요도) ==",
    "",
    "1. Mixin 사용 (절대 규칙):",
    "   ❌ 잘못된 예:",
    "      width: rem(24px);",
    "      height: rem(24px);",
    "      border-radius: rem(4px);",
    "      gap: rem(8px);",
    "      margin: 20px;",
    "      padding: 10px 20px;",
    "",
    "   ✅ 올바른 예:",
    "      @include rem(width, 24);",
    "      @include rem(height, 24);",
    "      @include rem(border-radius, 4);",
    "      @include rem(gap, 8);",
    "      @include rem(margin, 20);",
    "      @include rem(padding, 10 20);",
    "",
    "   - 모든 수치 속성에 @include rem() 믹스인을 필수 사용",
    "   - px 단위 제거하고 숫자만 사용: @include rem(font-size, 16)",
    "   - 여러 값: @include rem(margin, 10 20 15) 형태로 사용",
    "   - calc() 계산식만 예외: top: calc(50% - 10px)",
    "",
    "2. 색상 변수 사용 (절대 규칙):",
    "   ❌ 잘못된 예:",
    "      color: $color-primary;",
    "      background: $white;",
    "      border-color: $gray-500;",
    "",
    "   ✅ 올바른 예:",
    "      color: #3b82f6;",
    "      background: #ffffff;",
    "      border-color: #6b7280;",
    "",
    "   - 모든 색상은 직접 hex 값 사용",
    "   - 변수 사용 금지",
    "",
    "3. 상위 태그 클래스 중심 작성 (필수):",
    "   - 모든 SCSS는 반드시 상위 클래스 내에 중첩하여 작성",
    "   - 개별 요소 스타일을 독립적으로 정의하지 말 것",
    "",
    "4. 중첩 제한 (4단계까지만):",
    "   - SCSS 중첩은 최대 4단계까지만 허용",
    "   - 컴파일 후 CSS가 5중첩 이상 되지 않도록 주의",
    "",
    "반드시 위 가이드라인을 100% 준수하여 SCSS를 생성하세요.",
  ];

  const htmlAnalysis = analyzeHtmlStructureForScss(htmlCode);
  const mcpStyleInfo = extractStyleInfoFromMcp(mcpJson);

  const htmlText = String(htmlCode || "").trim();
  const mcpText = safeStringify(mcpJson);
  const analysisText = generateScssAnalysisText(htmlAnalysis, mcpStyleInfo);

  return (
    header +
    guidelines.join("\n") +
    "\n\n== HTML 구조 분석 결과 ==\n" +
    analysisText +
    "\n\n[HTML_CODE]\n" +
    htmlText +
    "\n[/HTML_CODE]\n\n[MCP_SELECTION_JSON]\n" +
    mcpText +
    "\n[/MCP_SELECTION_JSON]"
  );
}

// MCP 데이터에서 스타일 정보 추출
function extractStyleInfoFromMcp(mcpJson) {
  const styleInfo = {
    colors: [],
    sizes: [],
    positions: [],
    fonts: [],
  };

  function traverseNode(node) {
    if (!node) return;

    if (node.backgroundColor) {
      const { r, g, b } = node.backgroundColor;
      const hex = rgbToHex(r, g, b);
      if (!styleInfo.colors.includes(hex)) {
        styleInfo.colors.push(hex);
      }
    }

    if (node.borderColor) {
      const { r, g, b } = node.borderColor;
      const hex = rgbToHex(r, g, b);
      if (!styleInfo.colors.includes(hex)) {
        styleInfo.colors.push(hex);
      }
    }

    if (node.size) {
      styleInfo.sizes.push(node.size);
    }

    if (node.position) {
      styleInfo.positions.push(node.position);
    }

    if (node.fontFamily && !styleInfo.fonts.includes(node.fontFamily)) {
      styleInfo.fonts.push(node.fontFamily);
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => traverseNode(child));
    }
  }

  if (mcpJson && mcpJson.selection) {
    mcpJson.selection.forEach((node) => traverseNode(node));
  }

  return styleInfo;
}

// RGB를 HEX로 변환하는 유틸리티 함수
function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// 클래스 리스트를 활용한 HTML 프롬프트
function buildHtmlPromptFromMcpWithClassList(mcpJson, userPrompt, classNames) {
  const header = userPrompt ? String(userPrompt).trim() + "\n\n" : "";
  const guidelines = [
    "당신은 피그마 MCP JSON을 기반으로 HTML 코딩 가이드라인에 완벽히 준수하는 HTML을 생성하는 도우미입니다.",
    "반드시 순수 HTML만 반환하세요. 코드펜스(```), 마크다운, 설명 텍스트는 금지입니다.",
    "아래 CLASS_LIST의 클래스만 사용해 class 속성을 지정하세요. 새로운 클래스명을 만들지 마세요.",
    "",
    "== HTML 코딩 가이드라인 필수 준수사항 ==",
    "",
    "1. 시맨틱 태그 우선 사용:",
    "   - header, nav, main, section, article, aside, footer",
    "   - 첫 번째 클래스를 최상위 래퍼로 사용하되 적절한 시맨틱 태그 적용",
    "",
    "2. 클래스 네이밍 (케밥 케이스):",
    "   - 제공된 CLASS_LIST만 사용",
    "   - component- 접두사 클래스는 컴포넌트로 인식하여 적절히 구조화",
    "",
    "3. 구조화 규칙:",
    "   - 반복 아이템 → <ul>, <li> 필수",
    "   - 텍스트 → h1-h6 (계층적) 또는 p 태그",
    "   - 버튼 → <button type='button'> 또는 <a href=''>",
    "   - 이미지 → <figure>, <img>",
    "",
    "4. 아이콘 표현:",
    "   - <i class='ico-아이콘명 ico-normal' aria-hidden='true'></i>",
    "   - 의미있는 아이콘에는 role='img' aria-label='설명' 추가",
    "",
    "5. 접근성:",
    "   - 적절한 ARIA 속성 사용",
    "   - 구조 주석으로 섹션 구분",
  ];

  const mcpText = safeStringify(mcpJson);
  const classesText =
    Array.isArray(classNames) && classNames.length ? classNames.join(", ") : "";

  return (
    header +
    guidelines.join("\n") +
    "\n\n[CLASS_LIST]\n" +
    classesText +
    "\n[/CLASS_LIST]\n\n[MCP_SELECTION_JSON]\n" +
    mcpText +
    "\n[/MCP_SELECTION_JSON]"
  );
}

// 클래스 리스트에서 래퍼 후보 선택
function pickWrapperClassFromClassList(classNames) {
  if (Array.isArray(classNames) && classNames.length) return classNames[0];
  return "";
}

// HTML 최상위에 래퍼 클래스 강제 적용
function ensureWrapperClassInHtml(html, wrapperClass) {
  if (!html || !wrapperClass) return html;
  try {
    const cls = String(wrapperClass).replace(/^[.]/, "");
    let s = String(html);
    const tagRe = /<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/;
    const m = s.match(tagRe);
    if (!m) return s;
    const before = s.slice(0, m.index);
    const full = m[0];
    const after = s.slice(m.index + full.length);
    if (/class\s*=/.test(full)) {
      const updated = full.replace(
        /class\s*=\s*(["'])([^"']*)(["'])/,
        (__, q1, val, q2) => `class=${q1}${val ? val + " " : ""}${cls}${q2}`
      );
      return before + updated + after;
    } else {
      const updated = full.replace(
        /<([a-zA-Z][a-zA-Z0-9-]*)\b/,
        `<$1 class="${cls}"`
      );
      return before + updated + after;
    }
  } catch (e) {
    return html;
  }
}

// 선택된 노드들을 MCP 호환 JSON으로 변환
function generateMcpJson(selection) {
  return {
    timestamp: new Date().toISOString(),
    figmaFile: {
      id: figma.fileKey,
      name: figma.root.name,
    },
    selection: selection.map((node) => convertNodeToMcp(node)),
  };
}

function convertNodeToMcp(node, depth = 0) {
  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    depth,
  };

  if ("x" in node && "y" in node) {
    info.position = { x: node.x, y: node.y };
  }
  if ("width" in node && "height" in node) {
    info.size = { width: node.width, height: node.height };
  }

  if (node.type === "TEXT") {
    info.text = node.characters;
    if (node.fontSize) info.fontSize = node.fontSize;
    if (node.fontName && node.fontName.family)
      info.fontFamily = node.fontName.family;
    if (node.fontName && node.fontName.style)
      info.fontWeight = node.fontName.style;
  }

  if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill && fill.type === "SOLID" && fill.color) {
      info.backgroundColor = {
        r: Math.round(fill.color.r * 255),
        g: Math.round(fill.color.g * 255),
        b: Math.round(fill.color.b * 255),
        a: typeof fill.opacity === "number" ? fill.opacity : 1,
      };
    }
  }

  if (
    "strokes" in node &&
    Array.isArray(node.strokes) &&
    node.strokes.length > 0
  ) {
    const stroke = node.strokes[0];
    if (stroke && stroke.type === "SOLID" && stroke.color) {
      info.borderColor = {
        r: Math.round(stroke.color.r * 255),
        g: Math.round(stroke.color.g * 255),
        b: Math.round(stroke.color.b * 255),
        a: typeof stroke.opacity === "number" ? stroke.opacity : 1,
      };
    }
  }

  if ("strokeWeight" in node) info.borderWidth = node.strokeWeight;
  if ("cornerRadius" in node) info.borderRadius = node.cornerRadius;

  if ("children" in node && Array.isArray(node.children)) {
    info.children = node.children.map((child) =>
      convertNodeToMcp(child, depth + 1)
    );
  } else {
    info.children = [];
  }

  return info;
} // Claude API 설정
var CLAUDE_API_KEY = ""; // 사용자가 설정할 API 키
var CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
var CLAUDE_MODEL = "claude-3-haiku-20240307";

// 프록시 서버 설정 (여러 대안 제공)
var PROXY_OPTIONS = {
  // 방법 1: CORS 프록시 서버
  corsProxy: "https://cors-anywhere.herokuapp.com/",

  // 방법 2: Cloudflare Workers 프록시
  cloudflareProxy: "https://claude-proxy.your-domain.workers.dev/",

  // 방법 3: 자체 프록시 서버
  customProxy: "https://your-proxy-server.com/claude/",

  // 방법 4: Netlify Functions 프록시 (사용자가 설정)
  netlifyProxy: "",

  // 방법 5: Vercel Functions 프록시
  vercelProxy: "https://your-app.vercel.app/api/claude-proxy",
};

// 현재 사용할 프록시 방법 (사용자가 선택 가능)
var CURRENT_PROXY_METHOD = "netlifyProxy";

// 프록시 설정 관리 함수들
async function saveProxySettings(method, customUrl = "") {
  try {
    const settings = {
      method: method,
      customUrl: customUrl,
      timestamp: new Date().toISOString(),
    };

    // clientStorage 사용 시도
    try {
      await figma.clientStorage.setAsync(
        PROXY_SETTINGS_KEY,
        JSON.stringify(settings)
      );
      console.log("프록시 설정이 clientStorage에 저장되었습니다.");
    } catch (storageError) {
      console.warn("clientStorage 저장 실패, 메모리에만 저장:", storageError);
      // clientStorage 실패 시 메모리에만 저장
    }

    // 메모리에 설정 저장 (항상 성공)
    CURRENT_PROXY_METHOD = method;
    if (customUrl) {
      if (method === "customProxy") {
        PROXY_OPTIONS.customProxy = customUrl;
        console.log("사용자 정의 프록시 URL 설정:", customUrl);
      } else if (method === "netlifyProxy") {
        PROXY_OPTIONS.netlifyProxy = customUrl;
        console.log("Netlify 프록시 URL 설정:", customUrl);
      }
    }

    console.log("현재 프록시 설정:", {
      method: CURRENT_PROXY_METHOD,
      url: PROXY_OPTIONS[CURRENT_PROXY_METHOD],
      allOptions: PROXY_OPTIONS,
    });

    // UI에 성공 메시지 전송
    figma.ui.postMessage({
      type: "proxy_settings_saved",
      success: true,
      method: method,
      customUrl: customUrl,
    });

    return { success: true };
  } catch (e) {
    console.error("프록시 설정 저장 중 오류:", e);
    return { success: false, error: String(e) };
  }
}

async function loadProxySettings() {
  try {
    // clientStorage에서 설정 로드 시도
    try {
      const stored = await figma.clientStorage.getAsync(PROXY_SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        CURRENT_PROXY_METHOD = settings.method || "netlifyProxy";

        if (settings.customUrl) {
          if (settings.method === "customProxy") {
            PROXY_OPTIONS.customProxy = settings.customUrl;
          } else if (settings.method === "netlifyProxy") {
            PROXY_OPTIONS.netlifyProxy = settings.customUrl;
          }
        }

        console.log(
          "프록시 설정이 clientStorage에서 로드되었습니다:",
          settings
        );
        return settings;
      }
    } catch (storageError) {
      console.warn("clientStorage에서 설정 로드 실패:", storageError);
    }

    // 기본 설정 반환
    const defaultSettings = {
      method: "netlifyProxy",
      customUrl: "",
      timestamp: new Date().toISOString(),
    };

    CURRENT_PROXY_METHOD = defaultSettings.method;
    return defaultSettings;
  } catch (e) {
    console.error("프록시 설정 로드 중 오류:", e);
    return null;
  }
}

// 프록시 서버 상태 확인
async function testProxyConnection(proxyMethod) {
  let timeoutId = null; // 타임아웃 ID를 함수 상단에서 선언
  
  try {
    const proxyUrl = PROXY_OPTIONS[proxyMethod];
    if (!proxyUrl) {
      return {
        success: false,
        error: `프록시 URL이 설정되지 않음 (${proxyMethod})`,
      };
    }

    console.log(`프록시 연결 테스트 시작: ${proxyMethod} -> ${proxyUrl}`);

    // 타임아웃 설정 (10초) - Promise.race를 사용한 안전한 방식
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("연결 시간 초과 (10초)"));
      }, 10000);
    });

    try {
      // Netlify Functions는 POST 요청을 기대하므로 POST로 테스트
      const fetchPromise = fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Figma-Plugin/1.0",
        },
        body: JSON.stringify({
          test: true,
          message: "프록시 연결 테스트",
          timestamp: new Date().toISOString(),
        }),
      });
      
      // 타임아웃과 fetch 요청을 경쟁시킴
      const testResponse = await Promise.race([fetchPromise, timeoutPromise]);
      
      // 성공 시 타임아웃 정리
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      console.log(
        `프록시 응답 상태: ${testResponse.status} ${testResponse.statusText}`
      );

      // 응답 본문 확인
      let responseBody = "";
      try {
        responseBody = await testResponse.text();
        console.log("프록시 응답 본문:", responseBody);
      } catch (bodyError) {
        console.warn("응답 본문 읽기 실패:", bodyError);
      }

      return {
        success: testResponse.ok,
        status: testResponse.status,
        statusText: testResponse.statusText,
        body: responseBody,
      };
    } catch (fetchError) {
      // 에러 발생 시 타임아웃 정리
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      throw fetchError;
    }
  } catch (e) {
    // 최종 에러 처리에서도 타임아웃 정리
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    console.error(`프록시 연결 테스트 실패 (${proxyMethod}):`, e);
    
    let errorMessage = e.message;
    if (e.message.includes("연결 시간 초과")) {
      errorMessage =
        "연결 시간 초과 (10초) - 네트워크 상태 또는 프록시 서버 응답 지연";
    } else if (e.message.includes("Failed to fetch")) {
      errorMessage =
        "네트워크 연결 실패 - CORS 정책 또는 도메인 접근 권한 확인 필요";
    }
    
    return {
      success: false,
      error: `연결 실패: ${errorMessage}`,
    };
  }
}

// UI 표시
figma.showUI(__html__, { width: 520, height: 560 });

// 저장 키 이름
const STORAGE_KEY = "claude_api_key";
const PROXY_SETTINGS_KEY = "claude_proxy_settings";

// 최근 SCSS에서 추출한 클래스 목록을 저장하여 HTML 동기화에 사용
let LAST_SCSS_CLASSES = [];
// HTML 코드와 MCP 데이터를 저장하여 SCSS 생성에 활용
let LAST_HTML_CODE = "";
let LAST_MCP_DATA = null;

/**
 * Claude 요청 바디 생성
 */
function buildClaudeRequestBody(prompt) {
  return {
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };
}

/**
 * Claude 응답 파싱 (텍스트 추출)
 */
function parseClaudeResponse(data) {
  if (!data) return "";
  const content = data.content || [];
  if (content.length === 0) return "";
  const first = content[0];
  if (first && first.type === "text" && first.text) {
    return first.text;
  }
  return "";
}

/**
 * API 키 저장
 */
async function saveApiKey(apiKey) {
  CLAUDE_API_KEY = apiKey || "";
  try {
    await figma.clientStorage.setAsync(STORAGE_KEY, CLAUDE_API_KEY);
    return { persisted: true };
  } catch (e) {
    return { persisted: false, error: String(e && e.message ? e.message : e) };
  }
}

/**
 * API 키 로드
 */
async function loadApiKey() {
  try {
    const stored = await figma.clientStorage.getAsync(STORAGE_KEY);
    CLAUDE_API_KEY = typeof stored === "string" ? stored : "";
    return CLAUDE_API_KEY;
  } catch (e) {
    return "";
  }
}

/**
 * Claude 호출 (프록시 서버 사용)
 */
async function callClaude(apiKey, prompt) {
  if (!apiKey) throw new Error("API 키가 설정되지 않았습니다.");

  const body = prompt
    ? buildClaudeRequestBody(prompt)
    : buildClaudeRequestBody("ping");

  // 여러 방법으로 API 호출 시도
  let lastError = null;

  // 방법 1: 직접 호출 시도
  try {
    const resp = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (resp.ok) {
      const data = await resp.json();
      return parseClaudeResponse(data);
    }
  } catch (e) {
    lastError = e;
    console.log("직접 호출 실패, 프록시 서버 시도:", e.message);
  }

  // 방법 2: 프록시 서버를 통한 호출
  try {
    const proxyUrl = PROXY_OPTIONS[CURRENT_PROXY_METHOD];
    if (!proxyUrl) {
      throw new Error("프록시 서버가 설정되지 않았습니다.");
    }

    const resp = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Anthropic-Version": "2023-06-01",
        "X-Target-URL": CLAUDE_API_URL,
      },
      body: JSON.stringify(body),
    });

    if (resp.ok) {
      const data = await resp.json();
      return parseClaudeResponse(data);
    } else {
      const text = await safeReadText(resp);
      throw new Error(
        `프록시 서버 오류: HTTP ${resp.status}: ${text || "요청 실패"}`
      );
    }
  } catch (e) {
    console.log("프록시 서버 호출 실패:", e.message);

    // 방법 3: 대체 프록시 서버 시도
    if (CURRENT_PROXY_METHOD !== "corsProxy") {
      try {
        const fallbackProxy = PROXY_OPTIONS.corsProxy;
        const resp = await fetch(fallbackProxy + CLAUDE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            Origin: "https://www.figma.com",
          },
          body: JSON.stringify(body),
        });

        if (resp.ok) {
          const data = await resp.json();
          return parseClaudeResponse(data);
        }
      } catch (fallbackError) {
        console.log("대체 프록시 서버도 실패:", fallbackError.message);
      }
    }

    // 모든 방법 실패 시 원래 오류 반환
    throw new Error(
      `API 호출 실패: ${lastError ? lastError.message : e.message}`
    );
  }
}

async function safeReadText(resp) {
  try {
    return await resp.text();
  } catch (e) {
    return "";
  }
}

// 메시지 핸들러
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "getApiKey": {
        const key = await loadApiKey();
        figma.ui.postMessage({ type: "apiKeyValue", apiKey: key });
        break;
      }
      case "setApiKey": {
        const key = (msg.apiKey || "").trim();
        const result = await saveApiKey(key);
        figma.ui.postMessage({
          type: "apiKeySaved",
          ok: true,
          persisted: result.persisted,
          warning: result.persisted ? null : result.error,
        });
        break;
      }
      case "testApiKey": {
        const candidateKey = (msg.apiKey || "").trim();
        const key = candidateKey || (await loadApiKey());
        try {
          const text = await callClaude(key, '간단히 "pong"라고만 답하세요.');
          const ok = typeof text === "string" && text.length > 0;
          figma.ui.postMessage({
            type: "apiKeyTestResult",
            ok,
            error: ok ? null : "응답이 비어있습니다.",
          });
        } catch (e) {
          figma.ui.postMessage({
            type: "apiKeyTestResult",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "saveProxySettings": {
        try {
          const result = await saveProxySettings(msg.method, msg.customUrl);

          // 성공 시 추가 정보와 함께 메시지 전송
          if (result.success) {
            figma.ui.postMessage({
              type: "proxySettingsSaved",
              ok: true,
              method: msg.method,
              customUrl: msg.customUrl,
              error: null,
            });
          } else {
            figma.ui.postMessage({
              type: "proxySettingsSaved",
              ok: false,
              error: result.error || "알 수 없는 오류",
            });
          }
        } catch (e) {
          console.error("프록시 설정 저장 중 오류:", e);
          figma.ui.postMessage({
            type: "proxySettingsSaved",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "loadProxySettings": {
        try {
          const settings = await loadProxySettings();
          figma.ui.postMessage({
            type: "proxySettingsLoaded",
            ok: true,
            settings: settings,
          });
        } catch (e) {
          figma.ui.postMessage({
            type: "proxySettingsLoaded",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "testProxyConnection": {
        try {
          const result = await testProxyConnection(msg.proxyMethod);
          figma.ui.postMessage({
            type: "proxyConnectionTestResult",
            ok: result.success,
            status: result.status,
            statusText: result.statusText,
            error: result.success ? null : result.error,
          });
        } catch (e) {
          figma.ui.postMessage({
            type: "proxyConnectionTestResult",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "runPrompt": {
        const prompt = (msg.prompt || "").trim();
        if (!prompt) {
          figma.ui.postMessage({
            type: "promptResult",
            ok: false,
            error: "프롬프트가 비어있습니다.",
          });
          return;
        }
        const candidateKey = (msg.apiKey || "").trim();
        const key = candidateKey || (await loadApiKey());
        if (!key) {
          figma.ui.postMessage({
            type: "promptResult",
            ok: false,
            error: "API 키가 설정되지 않았습니다.",
          });
          return;
        }
        try {
          const text = await callClaude(key, prompt);
          figma.ui.postMessage({ type: "promptResult", ok: true, text });
        } catch (e) {
          figma.ui.postMessage({
            type: "promptResult",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "generateMcpData": {
        try {
          const selection = figma.currentPage.selection || [];
          if (!selection || selection.length === 0) {
            figma.ui.postMessage({
              type: "mcpDataResult",
              ok: false,
              error: "선택된 오브젝트가 없습니다.",
            });
            break;
          }

          const mcpJson = generateMcpJson(selection);
          LAST_MCP_DATA = mcpJson;
          LAST_SCSS_CLASSES = [];
          LAST_HTML_CODE = "";
          figma.ui.postMessage({
            type: "mcpDataResult",
            ok: true,
            json: JSON.stringify(mcpJson, null, 2),
          });
        } catch (e) {
          figma.ui.postMessage({
            type: "mcpDataResult",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "claudeGenerateHtml": {
        const candidateKey = (msg.apiKey || "").trim();
        const key = candidateKey || (await loadApiKey());
        if (!key) {
          figma.ui.postMessage({
            type: "claudeHtmlResult",
            ok: false,
            error: "API 키가 설정되지 않았습니다.",
          });
          break;
        }
        try {
          const selection = figma.currentPage.selection || [];
          if (!selection || selection.length === 0) {
            figma.ui.postMessage({
              type: "claudeHtmlResult",
              ok: false,
              error: "선택된 오브젝트가 없습니다.",
            });
            break;
          }
          const mcp = generateMcpJson(selection);
          LAST_MCP_DATA = mcp;

          let prompt;
          if (Array.isArray(LAST_SCSS_CLASSES) && LAST_SCSS_CLASSES.length) {
            prompt = buildHtmlPromptFromMcpWithClassList(
              mcp,
              msg.userPrompt || "",
              LAST_SCSS_CLASSES
            );
          } else {
            prompt = buildEnhancedHtmlPromptFromMcp(mcp, msg.userPrompt || "");
          }

          const text = await callClaude(key, prompt);
          let code = extractCodeBlock(text, "html");

          // HTML 코드 후처리
          code = postProcessHtmlCode(code);

          if (Array.isArray(LAST_SCSS_CLASSES) && LAST_SCSS_CLASSES.length) {
            const wrapper = pickWrapperClassFromClassList(LAST_SCSS_CLASSES);
            code = ensureWrapperClassInHtml(code, wrapper);
          }

          LAST_HTML_CODE = code;

          // 구조 분석 정보도 함께 전송
          const analysis = analyzeMcpForHtmlStructure(mcp);

          figma.ui.postMessage({
            type: "claudeHtmlResult",
            ok: true,
            code,
            analysis: analysis.recommendedStructure,
          });
        } catch (e) {
          figma.ui.postMessage({
            type: "claudeHtmlResult",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "claudeGenerateScss": {
        const candidateKey = (msg.apiKey || "").trim();
        const key = candidateKey || (await loadApiKey());
        if (!key) {
          figma.ui.postMessage({
            type: "claudeScssResult",
            ok: false,
            error: "API 키가 설정되지 않았습니다.",
          });
          break;
        }
        try {
          let mcp, htmlCode;

          if (LAST_HTML_CODE && LAST_MCP_DATA) {
            mcp = LAST_MCP_DATA;
            htmlCode = LAST_HTML_CODE;
          } else {
            const selection = figma.currentPage.selection || [];
            if (!selection || selection.length === 0) {
              figma.ui.postMessage({
                type: "claudeScssResult",
                ok: false,
                error: "선택된 오브젝트가 없습니다.",
              });
              break;
            }
            mcp = generateMcpJson(selection);
            htmlCode = "";
          }

          const prompt = htmlCode
            ? buildScssPromptFromHtmlAndMcp(htmlCode, mcp, msg.userPrompt || "")
            : buildScssPromptFromMcp(mcp, msg.userPrompt || "");

          const text = await callClaude(key, prompt);
          let code = extractCodeBlock(text, "scss");

          // SCSS 코드 후처리 (가이드라인 준수 확인)
          code = postProcessScssCode(code);

          // SCSS 분석 정보 생성
          const htmlAnalysis = htmlCode
            ? analyzeHtmlStructureForScss(htmlCode)
            : {
                allClasses: [],
                wrapperClass: "",
                semanticTags: [],
                componentClasses: [],
                interactiveElements: [],
                listStructures: [],
                iconElements: [],
              };
          const mcpStyleInfo = extractStyleInfoFromMcp(mcp);
          const analysisText = generateScssAnalysisText(
            htmlAnalysis,
            mcpStyleInfo
          );

          LAST_SCSS_CLASSES = extractClassNamesFromScss(code);

          figma.ui.postMessage({
            type: "claudeScssResult",
            ok: true,
            code,
            analysis: analysisText,
          });
        } catch (e) {
          figma.ui.postMessage({
            type: "claudeScssResult",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "analyzeHtmlForScss": {
        const candidateKey = (msg.apiKey || "").trim();
        const key = candidateKey || (await loadApiKey());
        if (!key) {
          figma.ui.postMessage({
            type: "claudeScssResult",
            ok: false,
            error: "API 키가 설정되지 않았습니다.",
          });
          break;
        }
        try {
          if (!msg.htmlCode || !LAST_MCP_DATA) {
            figma.ui.postMessage({
              type: "claudeScssResult",
              ok: false,
              error: "HTML 코드 또는 MCP 데이터가 없습니다.",
            });
            break;
          }

          const prompt = buildScssPromptFromHtmlAndMcp(
            msg.htmlCode,
            LAST_MCP_DATA,
            msg.userPrompt || ""
          );

          const text = await callClaude(key, prompt);
          let code = extractCodeBlock(text, "scss");

          // SCSS 코드 후처리 (가이드라인 준수 확인)
          code = postProcessScssCode(code);

          // SCSS 분석 정보 생성
          const htmlAnalysis = analyzeHtmlStructureForScss(msg.htmlCode);
          const mcpStyleInfo = extractStyleInfoFromMcp(LAST_MCP_DATA);
          const analysisText = generateScssAnalysisText(
            htmlAnalysis,
            mcpStyleInfo
          );

          LAST_SCSS_CLASSES = extractClassNamesFromScss(code);

          figma.ui.postMessage({
            type: "claudeScssResult",
            ok: true,
            code,
            analysis: analysisText,
          });
        } catch (e) {
          figma.ui.postMessage({
            type: "claudeScssResult",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      case "analyzeMcpStructure": {
        try {
          if (!LAST_MCP_DATA) {
            figma.ui.postMessage({
              type: "claudeHtmlResult",
              ok: false,
              error: "MCP 데이터가 없습니다.",
            });
            break;
          }

          const analysis = analyzeMcpForHtmlStructure(LAST_MCP_DATA);

          figma.ui.postMessage({
            type: "claudeHtmlResult",
            ok: true,
            code: "<!-- MCP 구조 분석 완료 -->",
            analysis: analysis.recommendedStructure,
          });
        } catch (e) {
          figma.ui.postMessage({
            type: "claudeHtmlResult",
            ok: false,
            error: String(e && e.message ? e.message : e),
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    figma.ui.postMessage({
      type: "promptResult",
      ok: false,
      error: String(e && e.message ? e.message : e),
    });
  }
};

// MCP → HTML 프롬프트 생성 (HTML 가이드라인 준수)
function buildHtmlPromptFromMcp(mcpJson, userPrompt) {
  const header = userPrompt ? String(userPrompt).trim() + "\n\n" : "";
  const guidelines = [
    "당신은 피그마 MCP JSON을 기반으로 HTML 코딩 가이드라인에 완벽히 준수하는 HTML을 생성하는 도우미입니다.",
    "반드시 순수 HTML만 반환하세요. 코드펜스(```), 마크다운, 설명 텍스트는 금지입니다.",
    "",
    "== HTML 코딩 가이드라인 필수 준수사항 ==",
    "",
    "1. 시맨틱 태그 사용:",
    "   - <header>: 페이지/섹션 헤더 (로고, 제목, 네비게이션)",
    "   - <nav>: 네비게이션 메뉴",
    "   - <main>: 페이지 주요 콘텐츠 (페이지당 하나만)",
    "   - <section>: 독립적인 섹션 (주제별 그룹화)",
    "   - <article>: 독립적으로 배포 가능한 콘텐츠",
    "   - <aside>: 사이드바, 관련 링크",
    "   - <footer>: 푸터 (저작권, 연락처)",
    "   - <figure>, <figcaption>: 이미지와 설명",
    "",
    "2. 클래스 네이밍 (케밥 케이스 필수):",
    "   - 올바른 예: main-container, main-container-title, benefit-item",
    "   - 잘못된 예: mainContainer, main_container, main__container",
    "",
    "3. 헤딩 태그 계층적 사용:",
    "   - h1: 페이지 최상위 제목 (하나만)",
    "   - h2: h1의 하위 섹션",
    "   - h3: h2의 하위 섹션 (순차적 사용)",
    "",
    "4. 리스트 구조:",
    "   - 반복되는 아이템은 반드시 <ul>, <li> 사용",
    "   - div로 반복 구조 만들지 마세요",
    "",
    "5. 링크 태그:",
    "   - <a href=''>로 href 값은 빈 값으로 설정",
    "   - href='javascript:void(0)' 사용 금지",
    "",
    "6. 아이콘 사용:",
    "   - <i class='ico-아이콘명 ico-normal' aria-hidden='true'></i>",
    "   - 의미있는 아이콘: <i class='ico-close ico-normal' role='img' aria-label='닫기'></i>",
    "",
    "7. 컴포넌트 클래스:",
    "   - component- 접두사 사용: component-input, component-tab, component-btns",
    "",
    "8. 접근성 ARIA 속성:",
    "   - aria-label, aria-hidden, role 속성 적절히 사용",
    "   - 버튼: aria-label='설명'",
    "   - 탭: role='tab', aria-selected, aria-controls",
    "",
    "9. 구조 주석:",
    "   - 주요 섹션에 <!-- 섹션명 시작 -->, <!-- 섹션명 끝 --> 주석",
    "",
    "MCP 데이터 분석 시 고려사항:",
    "- 텍스트 노드 → 적절한 헤딩(h1-h6) 또는 p 태그",
    "- 반복되는 구조 → ul/li 리스트",
    "- 버튼 형태 → button 태그 또는 적절한 역할",
    "- 이미지 영역 → figure/img 태그",
    "- 카드 형태 → article 또는 section",
    "- 네비게이션 → nav 태그",
  ];

  const jsonText = safeStringify(mcpJson);
  return (
    header +
    guidelines.join("\n") +
    "\n\n[MCP_SELECTION_JSON]\n" +
    jsonText +
    "\n[/MCP_SELECTION_JSON]"
  );
}

// MCP → SCSS 프롬프트 생성 (SCSS 가이드라인 준수)
function buildScssPromptFromMcp(mcpJson, userPrompt) {
  const header = userPrompt ? String(userPrompt).trim() + "\n\n" : "";
  const guidelines = [
    "당신은 피그마 MCP JSON을 기반으로 SCSS 코딩 가이드라인에 완벽히 준수하는 SCSS를 생성하는 도우미입니다.",
    "반드시 순수 SCSS만 반환하세요. 코드펜스(```), 마크다운, 설명 텍스트는 금지입니다.",
    "",
    "== SCSS 코딩 가이드라인 필수 준수사항 ==",
    "",
    "1. Mixin 사용 (★★★★★ 중요도):",
    "   - 모든 수치 속성에 @include rem() 믹스인을 필수 사용",
    "   - @include rem(margin, 20), @include rem(padding, 10 20 15)",
    "   - @include rem(font-size, 16), @include rem(border, 1px solid #333333)",
    "",
    "2. 색상 변수 사용 (★★★★★ 중요도):",
    "   - _variables.scss에 정의된 변수가 없으면 직접 hex 값 사용",
    "   - background-color: #3b82f6, color: #ffffff, border: 1px solid #cccccc",
    "",
    "3. 상위 태그 클래스 중심 작성 (필수):",
    "   - 최상위 래퍼 클래스를 하나 정해 그 내부에 중첩해 작성",
    "   - 모든 하위 요소는 상위 클래스 내에 중첩하여 정의",
    "",
    "4. 중첩 제한:",
    "   - SCSS 중첩은 최대 4단계까지만 허용",
    "   - 컴파일 후 CSS가 5중첩 이상 되지 않도록 주의",
    "",
    "5. MCP 데이터 활용:",
    "   - 색상 정보 → background-color, color, border-color",
    "   - 크기 정보 → width, height, padding, margin",
    "   - 폰트 정보 → font-family, font-size, font-weight",
    "",
    "6. 컴포넌트별 구조화:",
    "   - component- 클래스들을 적절히 구조화",
    "   - 컴포넌트 내부 요소들도 상위 컴포넌트 내에 중첩",
  ];
  const jsonText = safeStringify(mcpJson);
  return (
    header +
    guidelines.join("\n") +
    "\n\n[MCP_SELECTION_JSON]\n" +
    jsonText +
    "\n[/MCP_SELECTION_JSON]"
  );
}

// HTML + MCP → SCSS 프롬프트 생성 (SCSS 가이드라인 완벽 준수)
function buildScssPromptFromHtmlAndMcp(htmlCode, mcpJson, userPrompt) {
  const header = userPrompt ? String(userPrompt).trim() + "\n\n" : "";
  const guidelines = [
    "당신은 HTML 구조와 피그마 MCP JSON을 분석하여 SCSS 코딩 가이드라인에 완벽히 준수하는 SCSS를 생성하는 도우미입니다.",
    "반드시 순수 SCSS만 반환하세요. 코드펜스(```), 마크다운, 설명 텍스트는 금지입니다.",
    "",
    "== SCSS 코딩 가이드라인 필수 준수사항 ==",
    "",
    "1. Mixin 사용 (★★★★★ 중요도):",
    "   - 모든 수치 속성에 @include rem() 믹스인을 필수 사용",
    "   - 예시: @include rem(margin, 20), @include rem(padding, 10 20 15)",
    "   - 예시: @include rem(font-size, 16), @include rem(border, 1px solid #333333)",
    "   - calc() 계산식이 있는 경우만 mixin 사용 안 함",
    "",
    "2. 색상 변수 사용 (★★★★★ 중요도):",
    "   - _variables.scss에 정의된 변수가 없으면 직접 hex 값 사용",
    "   - background-color: #3b82f6 (변수 없으면 직접 지정)",
    "   - color: #ffffff (변수 없으면 직접 지정)",
    "   - border-color: #cccccc (변수 없으면 직접 지정)",
    "",
    "3. 상위 태그 클래스 중심 작성 (필수):",
    "   - 모든 SCSS는 반드시 상위 클래스 내에 중첩하여 작성",
    "   - 개별 요소 스타일을 독립적으로 정의하지 말 것",
    "   - 최상위 래퍼 클래스 하나를 선택하여 모든 스타일을 내부에 구조화",
    "",
    "4. 중첩 제한 (4단계까지만):",
    "   - SCSS 중첩은 최대 4단계까지만 허용",
    "   - 깊은 중첩 방지를 위해 클래스 기반 선택자 사용",
    "   - 컴파일 후 CSS가 5중첩 이상 되지 않도록 주의",
    "",
    "5. HTML 구조 완벽 매칭:",
    "   - HTML의 모든 클래스에 대응하는 스타일 작성",
    "   - HTML의 중첩 구조와 정확히 일치하는 SCSS 중첩",
    "   - 시맨틱 태그(header, nav, main, section 등)에 적절한 스타일",
    "",
    "6. MCP 데이터 활용:",
    "   - MCP의 색상 정보 → background-color, color, border-color",
    "   - MCP의 크기 정보 → width, height, padding, margin",
    "   - MCP의 폰트 정보 → font-family, font-size, font-weight",
    "   - MCP의 테두리 정보 → border-radius, border-width",
    "",
    "7. 컴포넌트 구조 최적화:",
    "   - component- 클래스들을 적절히 구조화",
    "   - 컴포넌트 내부 요소들도 상위 컴포넌트 내에 중첩",
    "   - 컴포넌트별 독립적이면서도 일관된 스타일링",
    "",
    "8. 상태 클래스 활용:",
    "   - .on, .off (버튼, 체크박스, 탭)",
    "   - .show, .hide (모달, 툴팁, 드롭다운)",
    "   - .current, .complete (진행 상태)",
    "   - .input-valid, .input-invalid (폼 검증)",
    "",
    "HTML 분석 시 주의사항:",
    "- 시맨틱 태그별 역할에 맞는 스타일링",
    "- ul/li 구조는 리스트 스타일 최적화",
    "- button 태그는 인터랙션 스타일 포함",
    "- 아이콘(i 태그)은 크기와 정렬 스타일",
    "- 컴포넌트 클래스는 모듈화된 스타일 구조",
  ];

  const htmlAnalysis = analyzeHtmlStructureForScss(htmlCode);
  const mcpStyleInfo = extractStyleInfoFromMcp(mcpJson);

  const htmlText = String(htmlCode || "").trim();
  const mcpText = safeStringify(mcpJson);
  const analysisText = generateScssAnalysisText(htmlAnalysis, mcpStyleInfo);

  return (
    header +
    guidelines.join("\n") +
    "\n\n== HTML 구조 분석 결과 ==\n" +
    analysisText +
    "\n\n[HTML_CODE]\n" +
    htmlText +
    "\n[/HTML_CODE]\n\n[MCP_SELECTION_JSON]\n" +
    mcpText +
    "\n[/MCP_SELECTION_JSON]"
  );
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return "";
  }
}

// 모델 응답에서 코드 본문 추출
function extractCodeBlock(text, langHint) {
  if (!text) return "";
  const t = String(text).trim();
  if (t.includes("```")) {
    const start = t.indexOf("```");
    if (start !== -1) {
      let afterStart = t.indexOf("\n", start + 3);
      if (afterStart === -1) afterStart = start + 3;
      const end = t.indexOf("```", afterStart);
      if (end !== -1) {
        return t.substring(afterStart + 1, end).trim();
      }
    }
  }
  return t;
}

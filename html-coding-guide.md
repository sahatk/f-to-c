## HTML 코딩 가이드

### 기본 원칙

- **문서 구조**: 모든 HTML 문서는 `<!DOCTYPE html>`로 시작하여 HTML5 문서임을 명시하고, 문자 인코딩은 `<meta charset="UTF-8">`를 사용하여 UTF-8로 설정합니다.

- **head 태그 수정 제한**: head 태그는 커스텀으로 수정할 수 있도록 수정하지 않습니다.

- **시맨틱 태그 사용**: 의미에 맞는 시맨틱 태그를 사용하여 HTML을 작성합니다.

  ```html
  <!-- 잘못된 예 -->
  <div class="header">...</div>

  <!-- 올바른 예 -->
  <header class="site-header">...</header>
  ```

- **클래스 네이밍**: 모든 마크업 클래스 네이밍은 케밥 케이스(Kebab Case)를 사용합니다. 모든 단어는 하이픈(-)으로 연결합니다.

  ```html
  <!-- 잘못된 예 -->
  <div class="mainContainer">...</div>
  <div class="main_container">...</div>
  <div class="main__container">...</div>

  <!-- 올바른 예 -->
  <div class="main-container">
    <div class="main-container-image">...</div>
    <div class="main-container-content">
      <h2 class="main-container-title">...</h2>
      <p class="main-container-description">...</p>
    </div>
  </div>
  ```

### 시맨틱 태그 사용 가이드

다음 시맨틱 태그를 적절히 활용하세요:

- `<header>`: 페이지 또는 섹션의 헤더. 로고, 제목, 네비게이션 메뉴, 검색 폼 등의 요소를 포함할 수 있습니다.
- `<nav>`: 네비게이션 메뉴. 주요 네비게이션 링크를 포함하는 영역입니다.
- `<main>`: 페이지의 주요 콘텐츠. 페이지당 하나만 사용해야 합니다.
- `<section>`: 콘텐츠의 독립적인 섹션. 주제별로 콘텐츠를 그룹화할 때 사용합니다.
- `<article>`: 독립적으로 배포 가능한 콘텐츠 (뉴스 기사, 블로그 포스트 등). 자체적으로 완결된 콘텐츠를 나타냅니다.
- `<aside>`: 주요 콘텐츠와 간접적으로 관련된 콘텐츠. 사이드바, 관련 링크, 광고 등에 사용합니다.
- `<footer>`: 페이지 또는 섹션의 푸터. 저작권 정보, 연락처, 관련 링크 등을 포함합니다.
- `<figure>` 및 `<figcaption>`: 이미지, 다이어그램 등과 그 설명. 독립적인 콘텐츠 단위로 사용됩니다.
- `<time>`: 날짜와 시간 정보. 기계가 읽을 수 있는 형식으로 시간 정보를 제공합니다.

### 코드 사용 규칙

#### 링크태그 (`<a href="">`)

- `<a href="">` 태그의 href 값은 빈 값으로 둡니다. URL값이 기획서에 있을 경우는 해당 URL을 넣어주고 없을 경우는 빈 값으로 두도록 합니다.
- 과거에는 `href="javascript:void(0)"` 등으로 처리했지만, 링크와 버튼의 구분이 명확한 현재는 이러한 방식을 지양합니다.

#### 헤딩태그 (`<h1>` ~ `<h6>`)

- **계층적 사용**: `<h1>`부터 `<h6>`까지의 헤딩은 계층적으로 사용해야 합니다. `<h1>`은 가장 높은 수준의 제목을 나타내고, `<h2>`은 `<h1>`의 하위 섹션, `<h3>`은 `<h2>`의 하위 섹션처럼 계속 이어지게 설계해야 합니다.
- **유일한 `<h1>`**: 각 페이지에는 하나의 `<h1>` 태그만 사용하는 것이 일반적인 권장사항입니다. 이는 페이지의 주제나 목적을 가장 잘 나타내는 제목입니다.
- **의미적 정확성**: 제목 태그는 오로지 제목을 위해 사용되어야 합니다. 스타일링 목적으로 제목 태그를 사용하지 않아야 하며, 대신 CSS를 사용하여 스타일을 적용해야 합니다.

#### 아이콘 사용 (`<i>`)

아이콘을 컨텐츠의 CSS 배경 이미지가 아닌, 별도의 HTML 마크업 요소로 포함하는 방식은 웹 접근성, 인터랙티브 디자인, 컨텐츠 관리 측면에서 장점을 제공합니다.

#### 리스트일 경우, 순서 태그 사용 (`<ul></ul>, <li></li>`)

- 만약 리스트일 경우, div 태그가 아닌, 별도의 HTML 마크업 <ul>, <li>를 사용한다.
- 예시 리스트 사용
- 반복되는 클래스명 마크업 구조에서 사용

````html
<!-- 리스트 -->
<ul>
  <li>아이템1</li>
  <li>아이템2</li>
  <li>아이템3</li>
</ul>

<!-- 반복되는 아이템 리스트 -->

```html
<ul class="benefits-card">
  <li class="benefit-item">
    <div class="benefit-icon">
      <div class="icon-circle">
        <i class="ico-point ico-normal" aria-hidden="true"></i>
      </div>
    </div>
    <div class="benefit-content">
      <h3 class="benefit-title">4% 포인트 적립</h3>
      <p class="benefit-description">얼리버드/ 1,3부형 적립</p>
    </div>
  </li>

  <li class="benefit-divider"></li>

  <li class="benefit-item">
    <div class="benefit-icon">
      <div class="icon-circle">
        <i class="ico-coupon ico-normal" aria-hidden="true"></i>
      </div>
    </div>
    <div class="benefit-content">
      <h3 class="benefit-title">10만원 쿠폰 증정</h3>
      <p class="benefit-description">가입즉시 발급, 당일사용 가능</p>
    </div>
  </li>

  <li class="benefit-divider"></li>

  <li class="benefit-item">
    <div class="benefit-icon">
      <div class="icon-circle">
        <i class="ico-discount ico-normal" aria-hidden="true"></i>
      </div>
    </div>
    <div class="benefit-content">
      <h3 class="benefit-title">5천원 예약 할인</h3>
      <p class="benefit-description">주중 그린피 상시 할인</p>
    </div>
  </li>
</ul>

```html
<!-- 스크린 리더에 읽히지 않아야 할 경우 -->
<i class="ico-close ico-normal" aria-hidden="true"></i>

<!-- 스크린 리더에 읽혀야 할 경우 -->
<i class="ico-close ico-normal" role="img" aria-label="닫기"></i>

<!-- 버튼 사용 예시 -->
<button type="button" class="btn">
  <i class="ico-search ico-normal" aria-hidden="true"></i>
  <span class="btn-txt">검색</span>
</button>
````

### 코멘트 사용 지침

- **구조 주석**: 큰 섹션의 시작과 끝을 표시하거나, 파일의 주요 부분을 구분하는 데 주석을 사용합니다.
- **일시적 주석**: 향후 수정이 필요하거나 잠시 비활성화된 코드에 대해 주석을 달아 해당 상황을 명확히 합니다.
- **HTML 주석**: HTML 주석은 `<!-- 주석 내용 -->` 형태로 사용합니다. 페이지 레이아웃의 주요 부분이나 복잡한 구조를 설명할 때 유용합니다.
- **HTML 수정 주석**: HTML 수정 주석은 `<!-- 20240228 수정 -->` `<!-- // 20240228 수정 -->` 형태로 시작과 끝을 표시해줍니다.
- **CSS 주석**: CSS 주석은 `/* 주석 내용 */` 형태로 사용합니다. 스타일 규칙의 목적이나 특정 속성의 사용 이유를 설명할 때 사용합니다.
- **CSS 수정 주석**: CSS 수정 주석은 개발자에게 전달할 필요가 없기 때문에 표시하지 않지만, 예외로 표시가 필요할 경우는 `/* 20240228 수정 */` `/* // 20240228 수정 */` HTML 주석과 동일하게 표시합니다.

> 💡 주석 사용은 코드의 의도와 구조를 명확히 하여 다른 개발자들이 코드를 이해하고 유지보수하는 데 큰 도움이 됩니다. 불필요하거나 오해를 불러일으킬 수 있는 주석은 피해야 합니다.

### 접근성을 위한 ARIA 라벨링

접근성 향상을 위해 ARIA 속성을 적절히 사용하세요:

```html
<!-- 버튼 예시 -->
<button type="button" class="menu-button" aria-label="메뉴 열기">
  <img src="menu-icon.svg" alt="" />
</button>

<!-- 탭 예시 -->
<div class="component-tab" data-component="tab" data-active="tab2">
  <div class="tab-head">
    <button type="button" class="tab-label" data-tab-value="tab1" role="tab" aria-selected="true" aria-controls="tab-panel-1">TAB 1</button>
    <button type="button" class="tab-label" data-tab-value="tab2" role="tab" aria-selected="false" aria-controls="tab-panel-2">TAB 2</button>
    <button type="button" class="tab-label" data-tab-value="tab3" role="tab" aria-selected="false" aria-controls="tab-panel-3">TAB 3</button>
  </div>
  <div class="tab-body">
    <div class="tab-content" data-tab-value="tab1" role="tabpanel" aria-labelledby="tab-1">
      <div class="content-inner"> Tab content 1 </div>
    </div>
    <div class="tab-content" data-tab-value="tab2" role="tabpanel" aria-labelledby="tab-2" hidden>
      <div class="content-inner"> Tab content 2 </div>
    </div>
    <div class="tab-content" data-tab-value="tab3" role="tabpanel" aria-labelledby="tab-2" hidden>
      <div class="content-inner"> Tab content 3 </div>
    </div>
  </div>
</div>
```

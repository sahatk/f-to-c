## CSS/SCSS 코딩 가이드

### Mixin 사용 가이드 - 중요도 ★★★★★

- 모든 적절한 속성에 @include rem() 믹스인을 적용합니다.

```scss
// 잘못된 예
.button {
  margin: 20px; // 수치있는 속성 @include rem() 사용안 한 잘못된 예
  font-size: 16px;
  padding: 10px 20px 15px; // 수치있는 속성 @include rem() 사용안 한 잘못된 예
  box-shadow: 0 4 8 0 rgba(0, 0, 0, 0.25); // 수치있는 속성 @include rem() 사용안 한 잘못된 예
  border: 1px solid #333333;
  @include rem(top, calc(50% - 9)); // calc 계산식 있는 부분은 제외
}

// 올바른 예
.button {
  @include rem(margin, 20); // 이렇게 수치있는 속성 모두 @include rem() 사용
  @include rem(font-size, 16); // 또는 @include f16;
  @include rem(padding, 10 20 15); // 이렇게 수치있는 속성 모두 @include rem() 사용, 여러 값 지정 가능
  @include rem(box-shadow, 0 4 8 0 rgba(0, 0, 0, 0.25)); // 이렇게 수치있는 속성 모두 @include rem() 사용, 여러 값 지정 가능
  @include rem(border, 1px solid #333333); // 수치있는 속성 모두 @include rem() 사용
  top: calc(50%- 9); // calc 계산식 있는 부분은 mixin 사용 하지 않음.
}
```

### 색상 변수 사용 가이드 - 중요도 ★★★★★

- 모든 변수는 직접 값을 지정합니다.

  ```scss
  // 잘못된 예
  .button {
    background-color: $color-primary-bg;
    color: $color-fff;
    @include rem(border, 1px solid $color-cccccc);
  }

  // 올바른 예
  .button {
    background-color: #3b82f6;
    color: #ffffff;
    border: 1px solid #cccccc;
  }
  ```

### SCSS 기본 구조

- 상위 태그 클래스를 중점으로 SCSS를 작성합니다.

  ```scss
  .notice-page {
    background: #ffffff;

    .notice-header {
      // 헤더 스타일
    }

    .notice-content {
      // 콘텐츠 스타일
    }
  }
  ```

- **상위 태그 클래스 중심 작성(필수)**: 모든 SCSS 코드는 반드시 상위 태그 클래스를 중심으로 작성해야 합니다. 개별 요소의 스타일을 독립적으로 정의하지 말고, 항상 상위 클래스 내에 중첩하여 작성하세요. 이는 코드의 가독성과 유지보수성을 높이는 핵심 원칙입니다.

  ```scss
  /* 잘못된 예 - 개별 스타일 정의 */
  .notice-header {
    @include rem(padding, 20);
  }

  .notice-content {
    @include rem(margin-top, 10);
  }

  /* 올바른 예 - 상위 클래스 중심 구조 */
  .notice-page {
    background: #ffffff;

    .notice-header {
      @include rem(padding, 20);
    }

    .notice-content {
      @include rem(margin-top, 10);
    }

    .notice-footer {
      @include rem(margin-top, 20);
    }
  }
  ```

- **컴포넌트 내부 요소 스타일링**: 컴포넌트 클래스 내부의 요소들도 반드시 상위 컴포넌트 선택자 내에 중첩하여 정의해야 합니다.

  ```scss
  /* 잘못된 예 */
  .component-input {
    display: flex;
  }

  .input-label {
    color: #333333;
  }

  .input-field {
    @include rem(border, 1px solid #dddddd);
  }

  /* 올바른 예 */
  .component-input {
    display: flex;

    .input-label {
      color: #333333;
    }

    .input-field {
      @include rem(border, 1px solid #dddddd);

      .input-control {
        @include rem(padding, 10);
      }
    }
  }
  ```

- **페이지별 스타일 구조화**: 각 페이지의 스타일은 최상위 페이지 클래스 내에 모든 하위 요소를 중첩하여 정의합니다. 이는 스타일 충돌을 방지하고 페이지별 스타일 관리를 용이하게 합니다.

  ```scss
  /* 회원가입 페이지 예시 */
  .signup-page {
    background-color: #f6f6f6;

    .signup-header {
      @include rem(padding, 20);

      .header-title {
        @include f24(600);
        line-height: 150%;
      }
    }

    .signup-form {
      @include rem(margin-top, 20);

      .form-section {
        @include rem(margin-bottom, 30);

        .section-title {
          @include rem(margin-bottom, 10);
        }

        .component-input {
          @include rem(margin-bottom, 15);
        }
      }
    }

    .signup-footer {
      @include rem(padding, 20 0);
    }
  }
  ```

### 중첩 코드 작성 가이드

#### 중첩 자세히 보기

CSS를 작성할 때 중첩의 정도는 주로 특정 선택자에 스타일을 적용하는 데 필요한 명확성과 코드의 유지보수성 사이의 균형을 고려하여 결정됩니다. 일반적으로, CSS에서의 중첩은 가능한 한 최소화하는 것이 좋습니다. 깊은 중첩은 CSS 코드의 복잡성을 증가시키고, 성능 저하를 일으킬 수 있으며, 유지보수를 어렵게 만듭니다.

##### 적당한 중첩의 정도

2~3단계 중첩은 대부분의 경우에 적당하다고 볼 수 있습니다. 이 정도의 중첩은 코드의 가독성을 유지하면서도 필요한 선택자의 명확성을 제공할 수 있습니다.
제한은 4단계 중첩까지만 허용합니다.

##### 깊은 중첩을 피하는 방법

- **클래스 기반 선택자 사용**: 가능한 한 태그나 ID 선택자 대신 클래스 선택자를 사용하고, 구체적인 클래스 이름을 통해 스타일을 적용합니다.
- **Sass, Less와 같은 CSS 전처리기의 중첩 기능 적절히 활용**: CSS 전처리기를 사용할 때는 중첩 기능을 적절히 활용하되, 깊은 중첩이 발생하지 않도록 주의합니다. 전처리기의 중첩 기능을 사용할 때도 3단계를 넘지 않도록 하는 것이 좋습니다.
- **컴파일된 CSS 확인**: sass로 코드 작성시 css로 변환 됐을때 5중첩 이상 되지 않도록 `/dist/assets/styles/style.css`에서 확인해보는 것도 좋은 방법입니다.
- **클래스 활용**: 클래스의 중첩을 피하기 위하여 컨텐츠유형, 컴포넌트유형 클래스를 잘 활용 하길 바랍니다.

#### 중첩 코드 최소화 예제

##### 예제 코드 1

**HTML**

```html
<table class="component-table-col01">
  <thead>
    <tr>
      <th>번호</th>
      <th>이름</th>
      <th>직업</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>홍길동</td>
      <td>도적</td>
    </tr>
    <tr>
      <td><div class="num">2</div></td>
      <td><div class="name">이순신</div></td>
      <td><div class="work">장군</div></td>
    </tr>
  </tbody>
</table>
```

**CSS**

```css
/* 잘못된 예 */
.component-table-col01 thead tr th { X }
.component-table-col01 thead tr td .name { X }

/* 올바른 예 */
.component-table-col01 { O }
.component-table-col01 th, .component-table-col01 td { O }
.component-table-col01 td .name { O }
.component-table-col01 thead { O }
.component-table-col01 tbody tr:nth-child(even) { O }
```

**SCSS**

```scss
/* 잘못된 예 */
.component-table-col01 {
  thead {
    tr {
      th {
      }
      td {
        .name {
        }
      }
    }
  }
}

/* 올바른 예 */
.component-table-col01 {
  th {
  }
  td {
    .name {
    }
  }
  thead {
  }
  tbody tr:nth-child(even) {
  }
}
```

##### 예제 코드 2

```scss
/* 중첩하지 않고 */
.table > thead > tr > th { … }
.table > thead > tr > td { … }

/* 중첩 포함 */
.table > thead {
  th { … }
  td { … }
}

/* 클래스를 활용하는 경우 */
.component-table {
	.table-thead {}
	.table-tr {}
	.table-td {}
}
```

##### 예제 코드 3

**HTML**

```html
<div class="component-accordion">
  <div class="accordion-item">
    <button class="accordion-button" type="button">Section 1</button>
    <div class="accordion-content">
      <p>This is the content of Section 1.</p>
    </div>
  </div>
  <div class="accordion-item">
    <button class="accordion-button" type="button">Section 2</button>
    <div class="accordion-content">
      <p>This is the content of Section 2.</p>
    </div>
  </div>
</div>
```

**CSS**

```css
.component-accordion .accordion-button {
}
.component-accordion .accordion-button:after {
}
.component-accordion .accordion-button.active:after {
}
.component-accordion .accordion-content {
}
```

**SCSS**

```scss
.component-accordion {
  .accordion-item {
    .accordion-button {
      &:after {
      }
      &.active:after {
      }
    }
    .accordion-content {
    }
  }
}
```

##### 예제 코드 4

**HTML**

```html
<div class="component-board">
  <div class="board-frame">
    <div class="board-container">
      <div class="board-header">
        <div class="board-info">
          <p>총 <span class="board-count">304</span>건, <span class="board-current">1</span>/<span class="board-total">31</span>페이지</p>
        </div>
        <div class="board-search">
          <div class="select-wrap">
            <select>
              <option value="title" selected>제목</option>
              <option value="content">내용</option>
              <option value="name">작성자</option>
            </select>
          </div>
          <div class="component-input">
            <div class="input-box">
              <input type="text" class="input" placeholder="검색어를 입력해주세요." />
              <button type="button" class="btn-reset">
                <span class="hide-txt">리셋</span>
              </button>
              <button type="button" class="btn-search">
                <span class="hide-txt">검색</span>
              </button>
            </div>
            <p class="input-desc"></p>
          </div>
        </div>
      </div>
      <div class="board-content">
        <table class="component-table">
          <caption>공지사항 게시물: 번호, 제목, 등록일, 등록자, 조회수</caption>
          <colgroup>
            <col style="width: 8%" />
            <col />
            <col style="width: 15%" />
            <col style="width: 15%" />
            <col style="width: 10%" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">번호</th>
              <th scope="col">제목</th>
              <th scope="col">등록일</th>
              <th scope="col">등록자</th>
              <th scope="col">조회수</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>5</td>
              <td>
                <a href="#"> 공지사항 게시물 제목입니다. </a>
              </td>
              <td>2024-02-14</td>
              <td>등록자이름</td>
              <td>1555</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
```

**SCSS**

```scss
/* 수정 전 코드 */
.component-board {
  .board-frame {
    .board-container {
      .board-header {
        .board-info {
        }
        .board-search {
          .select-wrap {
            select {
            }
          }
          .input-box {
            .input {
            }
            .btn-reset {
            }
            .btn-search {
            }
          }
        }
      }
      .board-content {
        .component-table {
          th {
          }
          th,
          td {
            > a {
              &:hover {
                text-decoration: underline;
              }
            }
          }
        }
      }
    }
  }
}

/* 수정 후 코드 */
.component-board {
  .board-frame {
  }
  .board-container {
  }
  .board-header {
  }
  .board-info {
  }
  .board-search {
    .select-wrap {
      select {
      }
    }
    .input-box {
      .input {
      }
      .btn-reset {
      }
      .btn-search {
      }
    }
  }
  .board-content {
    /* 수정 전 소스 */
    .component-table {
      td {
        > a {
          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    /* 수정 후 소스 */
    .component-table {
      .txt-link {
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
```

> 💡 CSS 셀렉터를 사용할 때는 가능한 한 간결하게 유지하고, 과도한 중첩을 피하는 것이 좋습니다. 이는 스타일 시트의 성능을 최적화하고, 코드의 유지보수와 확장성을 개선하는 데 도움이 됩니다.

### 상태에 따른 다중 클래스 사용

상태 클래스 약속어 (css스타일 + 스크립트 호출 + 개발 호출)
/_ 버튼, 체크박스, 탭등 _/
.on {}
.off {}

/_ 모달, 툴팁, 드롭다운, 아코디언등 _/
.show {}
.hide {}

/_ 고정 영역 _/
.fixed {} /_ position: fixed _/
.sticky {} /_ position: sticky _/

/_ 스텝등 _/
.current {} /_ 현재위치 _/
.complete {} /_ 완료된 항목 _/

/_ 폼 그룹 _/
.form-disabled {} /_ 폼 요소가 비활성화된 상태일 때의 스타일을 적용합니다. _/
.form-readonly {} /_ 읽기 전용 필드에 스타일을 적용합니다. _/
.form-valid {} /_ 입력 값이 검증 조건을 만족했을 때의 스타일을 적용합니다. _/
.form-invalid {} /_ 입력 값이 검증 조건을 만족하지 않았을 때의 스타일을 적용합니다. _/
.form-required {} /_ 필수 입력 필드에 스타일을 적용합니다. _/

/_ input 그룹 _/
.input-disabled {} /_ 폼 요소가 비활성화된 상태일 때의 스타일을 적용합니다. _/
.input-readonly {} /_ 읽기 전용 필드에 스타일을 적용합니다. _/
.input-valid {} /_ 입력 값이 검증 조건을 만족했을 때의 스타일을 적용합니다. _/
.input-invalid {} /_ 입력 값이 검증 조건을 만족하지 않았을 때의 스타일을 적용합니다. _/
.input-required {} /_ 필수 입력 필드에 스타일을 적용합니다. _/

/_ 상태 클래스명 사용하지 않아야 할 단어 _/
expand(확장하다), reduction(축소하다), fold(펼치다), unfold(접다) → 사용하지 않습니다.
상태 클래스명 사용하지 않아야 할 단어들은 on, off, show, hide로 대체 합니다.

```html 예시
<!-- 완료된 버튼 -->
<button type="button" class="btn-status completed">
  <span class="btn-txt">작성완료</span>
</button>

<!-- 완료된 스탬프 -->
<div class="stamp-item completed">
  <div class="stamp-circle">
    <p class="stamp-text"> 예약 완료 </p>
  </div>
  <div class="stamp-date">01.22</div>
</div>

<!-- 비활성화된 버튼 -->
<button type="button" class="btn-status disabled">
  <span class="btn-txt">작성보류</span>
</button>

<!-- 비활성화된 스탬프 -->
<div class="stamp-item disabled">
  <div class="stamp-circle">
    <p class="stamp-text"> 예약 보류 </p>
  </div>
  <div class="stamp-date">01.22</div>
</div>

<!-- 고정 영역 -->
<div class="sample-area fixed"> 고정해야할 영역이 필요할 경우 fixed 다중 클래스 추가 </div>

<!-- form 조건에 만족할 경우, 성공인 input-valid 다중 클래스 추가 -->
<div class="component-input input-valid">
  <div class="input-field">
    <label for="temp_input_0001" class="input-label">
      <span class="label-txt">
        비밀번호 재입력
        <i class="ico-required-mark" role="img" aria-label="필수">*</i>
      </span>
    </label>
    <div class="input-txt">
      <input type="password" id="temp_input_valid_0001" placeholder="비밀번호 재입력" />
    </div>
  </div>
  <div class="input-info">비밀번호가 일치합니다.</div>
</div>

<!-- form 조건에 만족하지 않을 경우, 실패인 input-invalid 다중 클래스 추가 -->
<div class="component-input input-invalid">
  <div class="input-field">
    <label for="temp_input_0001" class="input-label">
      <span class="label-txt">
        비밀번호 재입력
        <i class="ico-required-mark" role="img" aria-label="필수">*</i>
      </span>
    </label>
    <div class="input-txt">
      <input type="password" id="temp_input_valid_0001" placeholder="비밀번호 재입력" />
    </div>
  </div>
  <div class="input-info">비밀번호가 일치하지 않습니다.</div>
</div>
```

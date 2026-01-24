# DinaZen Changelog

## New Components

### Skeleton

Loading placeholder component with shimmer animation. Displays animated lines while content is loading.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Lines` | `int` | `3` | Number of placeholder lines to display |
| `Height` | `string` | `"1rem"` | Height of each line |
| `Radius` | `string` | `"0.25rem"` | Border radius of corners |
| `MaxWidth` | `string` | `"100%"` | Maximum width of the container |

**Usage:**

```razor
@* Basic usage *@
<Skeleton />

@* Custom configuration *@
<Skeleton Lines="5" Height="1.5rem" MaxWidth="400px" />

@* Single line loader *@
<Skeleton Lines="1" Height="2rem" Radius="0.5rem" />
```

---

### AvatarInitial

Displays a circular avatar with the first letter of the provided text. Each letter has a unique gradient color.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Data` | `string` | `""` | Text to extract initial from (shows "?" if empty) |
| `Size` | `string` | `"2.5rem"` | Width and height of the avatar |
| `Style` | `string` | `""` | Additional inline styles |
| `OnClick` | `EventCallback` | - | Click event handler |

**Usage:**

```razor
@* Basic usage *@
<AvatarInitial Data="John Doe" />

@* Custom size *@
<AvatarInitial Data="Ana" Size="3rem" />

@* With click handler *@
<AvatarInitial Data="User" OnClick="@HandleClick" />
```

---

### ScalableBlock

Wrapper component that allows users to zoom in/out on content. Scale preference is persisted in localStorage.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Key` | `string` | *required* | Unique key for storing scale preference |
| `ChildContent` | `RenderFragment` | - | Content to be scaled |

**Usage:**

```razor
<ScalableBlock Key="my-table">
    <table>
        <!-- table content -->
    </table>
</ScalableBlock>
```

---

### TryComponent

Error boundary wrapper that prevents child component exceptions from crashing the entire page. Optionally displays custom error content.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ChildContent` | `RenderFragment` | *required* | Content to render inside the error boundary |
| `ErrorContent` | `RenderFragment<Exception>?` | `null` | Optional custom content to show when an error occurs |

**Methods:**

| Method | Description |
|--------|-------------|
| `Recover()` | Resets the error state and re-renders the child content |

**Usage:**

```razor
@* Basic usage - silently catches errors *@
<TryComponent>
    <RiskyComponent />
</TryComponent>

@* With custom error display *@
<TryComponent>
    <ChildContent>
        <RiskyComponent />
    </ChildContent>
    <ErrorContent Context="ex">
        <div class="alert alert-danger">
            Error: @ex.Message
        </div>
    </ErrorContent>
</TryComponent>

@* With recovery button *@
<TryComponent @ref="tryRef">
    <ChildContent>
        <RiskyComponent />
    </ChildContent>
    <ErrorContent Context="ex">
        <button @onclick="tryRef.Recover">Retry</button>
    </ErrorContent>
</TryComponent>

@code {
    private TryComponent? tryRef;
}
```

---

### OfficeDocumentViewer

Embeds Office documents (Excel, Word, PowerPoint) using Microsoft Office Online viewer with download option.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `DocumentUrl` | `string` | *required* | URL of the Office document |
| `EmptyMessage` | `string` | `"No document URL provided."` | Message when URL is empty |

**Usage:**

```razor
<OfficeDocumentViewer DocumentUrl="https://example.com/report.xlsx" />
```

---

### EnumDropDown\<TEnum\>

Generic dropdown for enum types with support for `[Display]` attribute.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `TEnum` | - | Selected enum value |
| `ValueChanged` | `EventCallback<TEnum>` | - | Value change callback |
| `Name` | `string` | `""` | Form field name |
| `Style` | `string` | `"width:200px"` | CSS style |
| `Placeholder` | `string` | `""` | Placeholder text |
| `Disabled` | `bool` | `false` | Disable the dropdown |

**Usage:**

```razor
<EnumDropDown TEnum="Status" @bind-Value="selectedStatus" />

@code {
    public enum Status
    {
        [Display(Name = "In Progress")]
        InProgress,
        Completed,
        Cancelled
    }
    private Status selectedStatus;
}
```

---

### DeferredContent

Delays content rendering, showing a skeleton loader during the delay period.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `DelayMs` | `int` | `500` | Delay in milliseconds |
| `ChildContent` | `RenderFragment` | *required* | Content to render after delay |
| `LoadingContent` | `RenderFragment?` | `null` | Custom loading content |
| `Class` | `string` | `""` | CSS class for loading container |

**Usage:**

```razor
@* Basic usage *@
<DeferredContent DelayMs="300">
    <HeavyComponent />
</DeferredContent>

@* Custom loading *@
<DeferredContent>
    <LoadingContent>
        <p>Loading...</p>
    </LoadingContent>
    <ChildContent>
        <DataGrid />
    </ChildContent>
</DeferredContent>
```

---

### ProgressRhythm

Progress bar with rhythm indicator comparing current vs expected progress.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `CurrentProgress` | `decimal` | - | Current progress percentage |
| `ExpectedProgress` | `decimal` | - | Expected progress percentage |
| `Title` | `string` | `"Progress"` | Title label |
| `ExpectedLabel` | `string` | `"expected"` | Label for expected value |
| `GoalAchievedText` | `string` | `"Goal achieved!"` | Text when goal is reached |
| `OnTrackText` | `string` | `"On track"` | Text when on track |
| `AheadText` | `string` | `"Ahead by"` | Text when ahead |
| `BehindText` | `string` | `"Behind by"` | Text when behind |

**Usage:**

```razor
<ProgressRhythm CurrentProgress="65" ExpectedProgress="50" Title="Sales" />

@* Spanish localization *@
<ProgressRhythm
    CurrentProgress="30"
    ExpectedProgress="40"
    ExpectedLabel="esperado"
    GoalAchievedText="Meta alcanzada!"
    OnTrackText="En ritmo"
    AheadText="Adelantado"
    BehindText="Atrasado" />
```

---

### CountryBadge

Displays a country flag with ISO country code badge.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `CountryCode` | `string` | *required* | ISO 3166-1 alpha-2 code (e.g., "US", "ES") |
| `Size` | `int` | `22` | Flag size in pixels |
| `FlagUrlTemplate` | `string` | `"https://cdn.dinaup.com/public/flags/{0}.svg"` | URL template for flags |

**Usage:**

```razor
<CountryBadge CountryCode="ES" />
<CountryBadge CountryCode="US" Size="32" />
```

---

### TimeSpanDisplay

Displays a TimeSpan value formatted as days, hours, minutes, and optionally seconds.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `TimeSpan?` | - | TimeSpan to display |
| `ShowSeconds` | `bool` | `false` | Show seconds |
| `EmptyText` | `string` | `""` | Text when value is null |
| `NumberClass` | `string` | `"fw-semibold text-dark"` | CSS class for numbers |
| `LabelClass` | `string` | `"text-muted small ms-1"` | CSS class for labels |
| `Style` | `string` | `""` | Additional inline styles |

**Variants:**
- `TimeSpanDisplay.Compact` - Smaller text version
- `TimeSpanDisplay.Badge` - Badge styled version

**Usage:**

```razor
<TimeSpanDisplay Value="@TimeSpan.FromHours(25.5)" />
@* Output: 1d 1h 30m *@

<TimeSpanDisplay.Compact Value="@duration" />
<TimeSpanDisplay.Badge Value="@duration" ShowSeconds="true" />
```

---

### StatItem

Displays a statistic with optional icon, value, and label.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Label` | `string` | `""` | Label text below value |
| `ChildContent` | `RenderFragment` | *required* | Value content |
| `Icon` | `string` | `""` | Material icon name or image URL |
| `IconColor` | `string` | `"var(--rz-primary)"` | Icon color |
| `IconSize` | `string` | `"40px"` | Icon size |
| `ValueColor` | `string` | `""` | Value text color |
| `ValueSize` | `string` | `"fs-3"` | Value font size class |
| `Visible` | `bool` | `true` | Show/hide component |
| `Class` | `string` | `""` | Additional CSS class |

**Usage:**

```razor
<StatItem Label="Total Sales" Icon="attach_money" IconColor="#4CAF50">
    $12,500
</StatItem>

<StatItem Label="Users" Icon="/images/users.png">
    1,234
</StatItem>
```

---

### KpiCard

KPI card with optional gradient highlight and trending indicators.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Title` | `string` | `""` | Card title |
| `Value` | `string` | `""` | KPI value |
| `Icon` | `string` | `""` | Material icon name |
| `Color` | `string` | `"black"` | Value color (non-highlighted) |
| `Description` | `string` | `""` | Description text |
| `ButtonText` | `string` | `""` | Optional action button text |
| `ButtonIcon` | `string` | `""` | Button icon |
| `OnClick` | `EventCallback` | - | Button click handler |
| `HighlightColor` | `HighlightColorType` | `Undefined` | Gradient highlight color |
| `Variant` | `Radzen.Variant` | `Filled` | Card variant |
| `Class` | `string` | `""` | Additional CSS class |
| `Style` | `string` | `""` | Additional inline styles |

**HighlightColorType enum:** `Undefined`, `Auto`, `Red`, `Blue`, `Green`, `Yellow`, `Orange`, `Purple`, `Black`, `White`, `Gray`

**Usage:**

```razor
@* Standard card *@
<KpiCard Title="Revenue" Value="$45,000" Icon="payments" />

@* Highlighted with auto color (green for positive, red for negative) *@
<KpiCard Title="Growth" Value="+15%" HighlightColor="HighlightColorType.Auto" Icon="trending_up" />

@* With action button *@
<KpiCard Title="Pending" Value="23" ButtonText="View All" OnClick="@ViewPending" />
```

---

### Loader

Animated loading spinner with four horizontal bars.

**Usage:**

```razor
<Loader />
```

---

### CardKV

Card displaying a key-value pair with icon.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Icon` | `string` | `""` | Material icon name |
| `IconColor` | `string` | `Colors.Primary` | Icon color |
| `Tile` | `string` | `""` | Label/title text |
| `Value` | `string` | `""` | Value to display |
| `Style` | `string` | `""` | Additional inline styles |
| `Variant` | `Variant` | `Flat` | Card variant |

**Usage:**

```razor
<CardKV Icon="people" Tile="Users" Value="1,234" />
```

---

### HealthSection

Conditionally renders content based on a health check status.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `CheckName` | `string` | `""` | Name of the health check to evaluate |
| `ChildContent` | `RenderFragment?` | - | Content to render when healthy |

**Usage:**

```razor
<HealthSection CheckName="database">
    <DatabaseStats />
</HealthSection>
```

---

### StatsDisplay

Card displaying multiple statistics in a row.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Statistics` | `List<StatisticModel>` | *required* | List of statistics to display |
| `Variant` | `Variant` | - | Card variant |

**StatisticModel:** `{ Value, Label, Unit }`

**Usage:**

```razor
<StatsDisplay Statistics="@stats" />

@code {
    List<StatsDisplay.StatisticModel> stats = new()
    {
        new() { Value = "1,234", Label = "Users", Unit = "" },
        new() { Value = "56", Label = "Revenue", Unit = "K" }
    };
}
```

---

### SpanMinutes

Displays minutes formatted as hours and minutes.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `decimal?` | `0` | Minutes to display |
| `FontSize` | `string` | `"16px"` | Font size |

**Usage:**

```razor
<SpanMinutes Value="135" />
@* Output: 2h 15m *@
```

---

### SpanDecimal

Displays a decimal number with optional symbol and auto-coloring.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `decimal?` | - | Number to display |
| `Symbol` | `string` | `""` | Symbol suffix (e.g., "%") |
| `AutoColor` | `bool` | `false` | Green for positive, red for negative |
| `FontSize` | `string` | `"16px"` | Font size |
| `Class` | `string` | `""` | Additional CSS class |

**Usage:**

```razor
<SpanDecimal Value="15.5" Symbol="%" AutoColor="true" />
```

---

### SpanInteger

Displays an integer value formatted.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `decimal?` | - | Number to display as integer |
| `FontSize` | `string` | `"16px"` | Font size |

**Usage:**

```razor
<SpanInteger Value="1234" />
```

---

### SpanGrams

Displays weight in grams, auto-converting to Kg when > 1000g.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `decimal?` | - | Weight in grams |
| `AutoColor` | `bool` | `false` | Color based on weight |
| `FontSize` | `string` | `"16px"` | Font size |
| `Class` | `string` | `""` | Additional CSS class |

**Usage:**

```razor
<SpanGrams Value="1500" />
@* Output: 1.5 Kg *@

<SpanGrams Value="500" />
@* Output: 500 gr *@
```

---

### SpanMoney

Displays a monetary amount with optional label and icon.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Amount` | `decimal?` | `0` | Amount to display |
| `Label` | `string` | `""` | Label text |
| `Icon` | `string` | `""` | Material icon name |
| `AutoColor` | `bool` | `false` | Green for positive, red for negative |
| `AutoColorGreen` | `bool` | `false` | Green for positive only |
| `AutoColorRed` | `bool` | `false` | Red for negative only |
| `IsVisible` | `bool` | `true` | Show/hide component |
| `FontSize` | `string` | `"16px"` | Font size |
| `CssClass` | `string` | `""` | Additional CSS class |

**Usage:**

```razor
<SpanMoney Amount="1250.50" AutoColor="true" />
<SpanMoney Amount="-500" Label="Expenses" Icon="payments" />
```

---

### SpanKV

Key-value display with optional icon, horizontal or vertical layout.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Key` | `string` | `""` | Label text |
| `ChildContent` | `RenderFragment` | - | Value content |
| `Icon` | `string` | - | Material icon or image URL |
| `IconColor` | `string` | - | Icon color |
| `ValueColor` | `string` | - | Value text color |
| `Horizontal` | `bool` | `false` | Horizontal layout |
| `TextRight` | `bool` | `false` | Align text right |
| `LabelWidth` | `string` | - | Max width for label |
| `Visible` | `bool` | `true` | Show/hide component |
| `Class` | `string` | - | Additional CSS class |

**Usage:**

```razor
<SpanKV Key="Status" Icon="check_circle" IconColor="green">
    Active
</SpanKV>

<SpanKV Key="Total" Horizontal="true">
    $1,500
</SpanKV>
```

---

### SpanDateTime

Displays a DateTime with friendly formatting and optional status badge.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `DateTime?` | - | DateTime to display |
| `ShowBadge` | `bool` | `false` | Show as badge |
| `ShowStatus` | `bool` | `false` | Show status badge (Today, Tomorrow, Past) |
| `Caption` | `bool` | `false` | Use caption text style |
| `FontSize` | `string` | `"0.875rem"` | Font size |
| `Class` | `string` | `""` | Additional CSS class |

**Usage:**

```razor
<SpanDateTime Value="@DateTime.Now" ShowStatus="true" />
```

---

### SpanDate

Displays a DateOnly with friendly formatting and optional status badge.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `DateOnly?` | - | Date to display |
| `FriendlyMode` | `bool` | `true` | Use friendly date format |
| `ShowBadge` | `bool` | `false` | Show as badge |
| `ShowStatus` | `bool` | `false` | Show status badge |
| `FontSize` | `string` | `"0.875rem"` | Font size |
| `Class` | `string` | `""` | Additional CSS class |

**Usage:**

```razor
<SpanDate Value="@DateOnly.FromDateTime(DateTime.Now)" />
```

---

### FileName

Displays a file name with icon based on extension, size, and download link.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `FileNameDisplay` | `string` | - | File name with extension |
| `FileSize` | `long?` | - | File size in bytes |
| `DownloadURL` | `string` | - | Download URL |
| `OnClick` | `EventCallback` | - | Click handler (if no DownloadURL) |
| `OnClick_Icon` | `string` | `"arrow_right"` | Icon for click button |

**Usage:**

```razor
<FileName FileNameDisplay="report.xlsx" FileSize="1024000" DownloadURL="/files/report.xlsx" />
```

---

### StepperU / StepperStepU

Vertical stepper for step-by-step processes.

**StepperU Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ChildContent` | `RenderFragment` | Stepper steps |

**StepperStepU Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `Index` | `int` | Step number |
| `ChildContent` | `RenderFragment` | Step content |

**Usage:**

```razor
<StepperU>
    <StepperStepU Index="1">Create account</StepperStepU>
    <StepperStepU Index="2">Verify email</StepperStepU>
    <StepperStepU Index="3">Complete profile</StepperStepU>
</StepperU>
```

---

### FooterPoweredBy

Footer component with "Powered by Dinaup" branding.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Style` | `FooterStyleType` | `Modern` | `Compact` or `Modern` |

**Usage:**

```razor
<FooterPoweredBy />
<FooterPoweredBy Style="FooterPoweredBy.FooterStyleType.Compact" />
```

---

### PulseDotAnimation

Animated pulsing dot indicator for status display.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Color` | `PulseColor` | *required* | `Green`, `Yellow`, `Red`, `Gray` |
| `Pulse` | `bool` | `true` | Enable pulse animation |
| `Size` | `int` | `14` | Dot size in pixels |
| `RingPadding` | `int` | `6` | Padding around dot |
| `RingThickness` | `int` | `2` | Ring thickness |
| `Title` | `string` | - | Tooltip text |

**Usage:**

```razor
<PulseDotAnimation Color="PulseDotAnimation.PulseColor.Green" Title="Online" />
<PulseDotAnimation Color="PulseDotAnimation.PulseColor.Red" Pulse="false" />
```

---

### SearchInput

Search input with debounce functionality.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `string` | - | Current search value |
| `ValueChanged` | `EventCallback<string>` | - | Immediate value change |
| `BounceValueChanged` | `EventCallback<string>` | - | Debounced value change (500ms) |

**Usage:**

```razor
<SearchInput @bind-Value="searchText" BounceValueChanged="@OnSearch" />
```

---

### SpecialBadges

Pre-styled badges for common labels (Pro, Beta, New, Premium, IA).

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Type` | `BadgeType` | - | `Pro`, `Beta`, `New`, `IA`, `Premium` |

**Usage:**

```razor
<SpecialBadges Type="SpecialBadges.BadgeType.Pro" />
<SpecialBadges Type="SpecialBadges.BadgeType.Beta" />
<SpecialBadges Type="SpecialBadges.BadgeType.New" />
```

---

### CardTitle

Card header with icon, title, subtitle, badges, and help panel.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Title` | `string` | - | Main title |
| `Subtitle` | `string` | - | Subtitle text |
| `Icon` | `string` | - | Material icon or image URL |
| `Beta` | `bool` | `false` | Show Beta badge |
| `New` | `bool` | `false` | Show New badge |
| `HelpLink` | `string` | - | Documentation URL |
| `HelpContent` | `RenderFragment` | - | Custom help content |
| `Actions` | `RenderFragment` | - | Action buttons |

**Usage:**

```razor
<CardTitle Title="Sales Report" Icon="analytics" Beta="true">
    <Actions>
        <RadzenButton Text="Export" />
    </Actions>
</CardTitle>
```

---

### HighlightCode

Code block with syntax highlighting, line numbers, and copy button.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Code` | `string` | - | Code to display |
| `Language` | `string` | - | Language for highlighting |
| `FileName` | `string` | - | Optional file name |
| `ShowCopy` | `bool` | `true` | Show copy button |
| `ShowLineNumbers` | `bool` | `false` | Show line numbers |
| `Size` | `HighlightCodeSize` | `Default` | `Small`, `Default`, `Large` |

**Supported languages:** `csharp`, `javascript`, `typescript`, `razor`, `html`, `css`, `json`, `sql`, `bash`, `yaml`, `vbnet`

**Usage:**

```razor
<HighlightCode Code="@code" Language="csharp" ShowLineNumbers="true" />
```

---

### TimeComparisonDisplay

Compares actual vs planned time with progress bar and status indicators.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `PlannedTime` | `decimal` | `0` | Planned time in minutes |
| `ActualTime` | `decimal` | `0` | Actual time in minutes |
| `ShowProgressBar` | `bool` | `true` | Show progress bar |
| `ShowDiff` | `bool` | `true` | Show difference |
| `Compact` | `bool` | `false` | Compact inline mode |
| `Label` | `string?` | - | Optional label |

**Usage:**

```razor
<TimeComparisonDisplay PlannedTime="120" ActualTime="90" />
<TimeComparisonDisplay PlannedTime="60" ActualTime="75" Compact="true" />
```

---

### BadgetAutoColor

Smart badge that auto-colors based on semantic value (status, priority, time).

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Value` | `string` | - | Text to display and auto-color |
| `Color` | `EnumEstilosTextoEE` | `Indefinido` | Explicit color override |
| `BadgetStyle` | `Dictionary<string, int>` | - | Custom value-to-style mapping |
| `Visible` | `bool` | `true` | Show/hide component |
| `Style` | `string` | - | Additional inline styles |
| `Click` | `EventCallback` | - | Click handler |

**Auto-detected categories:** Success states, Danger states, Pending, In Progress, Warning, Time (Today/Tomorrow/Past), Sale/Purchase types, Invoice types, Priority levels

**Usage:**

```razor
<BadgetAutoColor Value="Completed" />
<BadgetAutoColor Value="Pending" />
<BadgetAutoColor Value="Cancelled" />
<BadgetAutoColor Value="High Priority" />
```

---

### Banner

Promotional/informational banner with multiple style presets.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Icon` | `string?` | - | Material icon name |
| `Title` | `string?` | - | Banner title |
| `ChildContent` | `RenderFragment?` | - | Banner content |
| `ButtonText` | `string?` | - | Action button text |
| `ButtonUrl` | `string?` | - | Action button URL |
| `OpenInNewTab` | `bool` | `true` | Open link in new tab |
| `Style` | `BannerStyle` | `Primary` | Visual style |
| `AdditionalClass` | `string?` | - | Additional CSS classes |

**BannerStyle enum:** `Primary`, `Gold`, `Love`, `Danger`, `Success`, `Warning`, `Pro`, `Beta`, `New`, `Premium`, `IA`

**Usage:**

```razor
<Banner Title="New Feature!" Style="Banner.BannerStyle.New" Icon="celebration"
        ButtonText="Learn More" ButtonUrl="/docs/new-feature">
    <p>Check out our latest update with amazing features.</p>
</Banner>

<Banner Title="Upgrade to Pro" Style="Banner.BannerStyle.Pro" Icon="bolt" />
```

# CK8.1: Foundational Access Integration (Optimized)

## Bible Access Integration for CG Handoffs
When handoffs require foundational guidance, CK must reference Bible Access patterns appropriately.

## Bible Access Functions
```xml
<!-- Get Foundational Document -->
<function_calls>
<invoke name="getBibleSection" call_id="N">
<parameter name="documentId">B3.4</parameter>
<parameter name="version">optimized</parameter>
</invoke>
</function_calls>

<!-- Search Foundational Content -->
<function_calls>
<invoke name="searchBibleContent" call_id="N">
<parameter name="query">UI guidelines</parameter>
<parameter name="sections">["b3"]</parameter>
</invoke>
</function_calls>
```

## When to Include Foundational Guidance
**Include in handoffs when CG needs:**
- UI/UX design standards (B3.4, B3.8)
- Architecture patterns (B2.5)
- Coding standards and best practices
- Project vision and principles (B1.1)
- Performance and optimization guidelines

## Integration Patterns for Handoffs
```
## Foundational Consultation
**Reference Documents**: [B3.4] for UI guidelines, [B2.5] for architecture
**Implementation Standards**: Follow KarmaCash patterns from foundational docs
**Quality Requirements**: Align with established standards in [B#.#]
```

## Best Practices
- Reference specific sections, not entire documents
- Include only relevant foundational guidance
- Provide context for why guidance is needed
- Ensure CG can access referenced documents

## CG Consultation Guidelines
- Load foundational documents only when specifically needed
- Use optimized versions for faster access
- Apply foundational principles to implementation decisions
namespace DinaZen.Services;

/// <summary>
/// Pluggable text processing tool interface. DinaZen defines it, external RCLs implement it.
/// Tools are discovered via DI (IEnumerable&lt;IDnzTextTool&gt;) and shown in HTML editor toolbars.
/// </summary>
public interface IDnzTextTool
{
	string Id { get; }
	string Name { get; }
	string Icon { get; }
	string Description { get; }
	int Order { get; }
	Task<string> ProcessAsync(string text, string context);
}

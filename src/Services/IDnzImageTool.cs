using Microsoft.AspNetCore.Components;

namespace DinaZen.Services;

/// <summary>
/// Pluggable image editing tool interface. DinaZen defines it, external RCLs implement it.
/// Tools are discovered via DI (IEnumerable&lt;IDnzImageTool&gt;) and shown in the image editor toolbar.
/// </summary>
public interface IDnzImageTool
{
	string Id { get; }
	string Name { get; }
	string Icon { get; }
	string Description { get; }
	int Order { get; }
	bool HasCustomUI { get; }
	Task<byte[]> ProcessAsync(byte[] imageBytes, IDnzImageToolContext context);
	RenderFragment GetToolPanel(IDnzImageToolContext context);

	/// <summary>
	/// URL-based processing: tool downloads from sourceUrl, processes, uploads result to S3, returns result GET URL.
	/// This avoids sending image data through SignalR. Default returns null (not supported), caller falls back to ProcessAsync.
	/// </summary>
	Task<string> ProcessFromUrlAsync(string sourceUrl, IDnzImageToolContext context) => Task.FromResult<string>(null);
}

public interface IDnzImageToolContext
{
	byte[] CurrentImageBytes { get; }
	void SetBusy(bool busy);
	Task ApplyResultAsync(byte[] resultBytes);
}

using System;

namespace tcv2.Api.Data.Dto;

public class BulkUploadSummaryDto
{
    public Guid[] CreatedIds { get; set; } = Array.Empty<Guid>();
    public int TotalProcessed { get; set; }
    public int Successful { get; set; }
    public int Failed { get; set; }
}


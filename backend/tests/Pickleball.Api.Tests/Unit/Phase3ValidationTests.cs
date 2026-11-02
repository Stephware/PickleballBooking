using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.DTOs.Courts;
using Pickleball.Api.DTOs.Venue;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Courts;
using Pickleball.Api.Services.Courts;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class Phase3ValidationTests
{
    [Fact]
    public void CourtRequest_RejectsNegativeRate()
    {
        var request = new SaveCourtRequest { CourtName = "Court 1", BaseHourlyRate = -1 };
        Assert.NotEmpty(Validate(request));
    }

    [Fact]
    public void VenueRequest_RejectsBadBrandColorAndSlug()
    {
        var request = new SaveVenueRequest
        {
            VenueName = "A", VenueSlug = "UPPER CASE", PrimaryColor = "red"
        };
        Assert.NotEmpty(Validate(request));
    }

    [Fact]
    public void VenueRequest_AllowsValidDefaults()
    {
        var request = new SaveVenueRequest
        {
            VenueName = "Local Pickleball", VenueSlug = "local-pickleball"
        };
        Assert.Empty(Validate(request));
    }

    private static List<ValidationResult> Validate(object value)
    {
        var errors = new List<ValidationResult>();
        Validator.TryValidateObject(value, new ValidationContext(value), errors, true);
        return errors;
    }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.Payments;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Bookings;
using Pickleball.Api.Services.Payments;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/payments")]
[Authorize(Roles = StaffRoles.AnyStaff)]
public sealed class PaymentsController(IPaymentService service) : ControllerBase
{
    [HttpGet("pending")]
    public async Task<IActionResult> Pending(CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(await service.PendingAsync(ct));
    }

    [HttpGet("bookings/{code}")]
    public async Task<IActionResult> BookingPayments(string code, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await service.StaffSummaryAsync(code, ct)); }
        catch (BookingException e) { return Error(e); }
    }

    [HttpGet("{id:long}/proof")]
    public async Task<IActionResult> Preview(long id, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        try
        {
            var proof = await service.ReadProofAsync(id, ct);
            if (!proof.SafeInline)
            {
                Response.Headers["Content-Disposition"] = "attachment; filename=payment-proof.pdf";
            }
            return File(proof.Bytes, proof.ContentType);
        }
        catch (BookingException e) { return Error(e); }
    }

    [HttpPost("bookings/{code}"), Authorize(Roles = StaffRoles.AnyStaff)]
    public async Task<IActionResult> Record(
        string code, RecordPaymentRequest request, CancellationToken ct)
    {
        try
        {
            var saved = await service.RecordStaffAsync(code, request, ct);
            return StatusCode(StatusCodes.Status201Created, saved);
        }
        catch (BookingException e) { return Error(e); }
    }

    [HttpPost("{id:long}/approve"), Authorize(Roles = StaffRoles.Management)]
    public Task<IActionResult> Approve(long id, ReviewPaymentRequest request, CancellationToken ct) =>
        Review(id, true, request, ct);

    [HttpPost("{id:long}/reject"), Authorize(Roles = StaffRoles.Management)]
    public Task<IActionResult> Reject(long id, ReviewPaymentRequest request, CancellationToken ct) =>
        Review(id, false, request, ct);

    [HttpPost("{id:long}/record-refund"), Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> RecordRefund(
        long id, RecordRefundRequest request, CancellationToken ct)
    {
        try { return Ok(await service.RecordRefundAsync(id, request.RefundReference, Actor(), ct)); }
        catch (BookingException e) { return Error(e); }
    }

    private async Task<IActionResult> Review(
        long id, bool approve, ReviewPaymentRequest request, CancellationToken ct)
    {
        try { return Ok(await service.ReviewAsync(id, approve, request.Notes, Actor(), ct)); }
        catch (BookingException e) { return Error(e); }
    }

    private long Actor() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static IActionResult Error(BookingException e) =>
        Pickleball.Api.Controllers.Public.BookingsController.ApiError(e);
}

using System;

namespace DinaZen.Shared.Models
{
    /// <summary>
    /// Model representing user session data stored in KV storage.
    /// </summary>
    public class SessionDataModel
    {
        /// <summary>
        /// Unique identifier for the session.
        /// </summary>
        public Guid SessionId { get; set; }

        /// <summary>
        /// User's unique identifier.
        /// </summary>
        public Guid UserId { get; set; }

        /// <summary>
        /// User's email address.
        /// </summary>
        public string UserEmail { get; set; }

        /// <summary>
        /// User's display name.
        /// </summary>
        public string UserName { get; set; }

        /// <summary>
        /// Business/Company identifier.
        /// </summary>
        public Guid BusinessId { get; set; }

        /// <summary>
        /// Tenant connection keyword for multi-tenancy.
        /// </summary>
        public string TenantConnectionKeyword { get; set; }

        /// <summary>
        /// UTC timestamp when the session was created.
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// UTC timestamp when the session expires.
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// User agent string from the client.
        /// </summary>
        public string UserAgent { get; set; }

        /// <summary>
        /// Client IP address.
        /// </summary>
        public string IP { get; set; }

        /// <summary>
        /// Checks if the session has expired.
        /// </summary>
        public bool IsExpired => ExpiresAt < DateTime.UtcNow;
    }
}
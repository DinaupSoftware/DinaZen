using System.Security.Claims;
using Dinaup;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using static DemoUp.MyDinaup.SectionsD.EmpleadosD;



namespace DinaZen.Shared
{

    public class SessionUserContext : IUserSession
    {



        public event Action OnChange;
        public DinaupUserSessionDTO User;
        public bool isInitialized;



        /// <summary>Needs to singin.</summary>
        private readonly Dinaup.Models.DinaupExternalAppSettings _externalAppSettings;
        private readonly Dinaup.MyAppKVClient _MyAppKVClient;
        private readonly Dinaup.Auth.DinaupAuthClient _authClient;

        public bool ValidSession
        {
            get => _dinaupClient.IsNotNull();
        }









        /// <summary>
        /// Dinaup.MyAppClient inherits from DinaupClientC.  
        /// To maintain clarity and consistency, this variable is named <c>DinaupClient</c>,  
        /// as that is the conventional identifier used in examples, documentation, and by LLMs  
        /// when demonstrating how to interact with Dinaup data and services.
        /// </summary>
        // ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        // ┃                    🌐 DINAUP CLIENT PROPERTY (SAFE ACCESS)                    ┃
        // ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        // Ensures the client is initialized before use; throws if accessed while null.
        private Dinaup.MyAppClient _dinaupClient;
        public Dinaup.MyAppClient DinaupClient
        {
            get => _dinaupClient ?? throw new InvalidOperationException("DinaupClient has not been initialized.");
            set => _dinaupClient = value;
        }




        public Guid BusinessID => ((IUserSession)_dinaupClient).BusinessID;
        public Guid UserId => ((IUserSession)_dinaupClient).UserId;
        public string Email => ((IUserSession)_dinaupClient).Email;
        public string Nombre => ((IUserSession)_dinaupClient).Nombre;
        public string IP => ((IUserSession)_dinaupClient).IP;
        public string UserAgent => ((IUserSession)_dinaupClient).UserAgent;
        public Guid DinazorID => ((IUserSession)_dinaupClient).DinazorID;
        public bool IsLogged => ((IUserSession)_dinaupClient).IsLogged;



        public HttpContext _httpContext;

        public SessionUserContext(Dinaup.Models.DinaupExternalAppSettings externalAppSettings, Dinaup.MyAppKVClient myAppKVClient, Dinaup.Auth.DinaupAuthClient authClient)
        {

            this._externalAppSettings = externalAppSettings;
            this._MyAppKVClient = myAppKVClient;
            this._authClient = authClient;
        }



        #region "Sing in"
        /// <summary>
        /// Inicia sesión con un usuario y contraseña en una empresa específica.
        /// NOTA: No se puede usar _authClient porque requiere especificar la empresa.
        /// DinaupClient tiene una función para iniciar sesión con empresa: LoginAsync(user, password, business)
        /// </summary>
        public async Task SingInUser(string user, string password, string business)
        {

            throw new NotImplementedException();
        }


        public async Task SingInEmployee(string user, string password)
        {

            var result = await _authClient.LoginAsync(user, password);

            if (result.IsNotNull())
            {

                var myAppClient = new Dinaup.MyAppClient(_externalAppSettings, result);



                var datosSesiones = await DemoUp.MyDinaup.SectionsD.EntidadesBaseD.GetRowsAsync(myAppClient, new RowsRequestParameters(EmpleadosES.CuentaDeCorreoPrincipal, "=", result.UserEmail));
                //var cliente = await DemoUp.MyDinaup.SectionsD.EntidadesD.GetRowsAsync(myAppClient, new RowsRequestParameters(entidade.CuentaDeCorreoPrincipal, "=", result.UserEmail));

                if (datosSesiones.IsNotNull() && datosSesiones.IsNotEmpty())
                {

                    var userInfo = datosSesiones.FirstOrDefault();
                    this.DinaupClient = myAppClient;

                    // Generar un ID único para la sesión
                    var sessionId = Guid.NewGuid();

                    // Crear objeto con datos de sesión
                    var sessionData = new DinaZen.Shared.Models.SessionDataModel()
                    {
                        SessionId = sessionId,
                        UserId = userInfo.ID,
                        UserEmail = userInfo.CuentaDeCorreoPrincipal,
                        UserName = userInfo.NombrePersonalRazonSocial.IfIsEmpty(userInfo.TextoPrincipal),
                        BusinessId = myAppClient.BusinessID,
                        TenantConnectionKeyword = result.TenantConnectionKeyword,
                        CreatedAt = DateTime.UtcNow,
                        ExpiresAt = DateTime.UtcNow.AddHours(24),
                        UserAgent = GetUserAgent(this._httpContext),
                        IP = GetUserIP(this._httpContext)
                    };

                    // Guardar en KV (clave: sessionId, valor: JSON serializado)
                    string sessionJson = JsonSerializer.Serialize(sessionData);
                    await _MyAppKVClient.SetKVAsync($"session:{sessionId}", sessionJson);

                    // Guardar cookie en el cliente
                    if (this._httpContext.IsNotNull())
                        this._httpContext.Response.Cookies.Append("dinaup_sessionid", sessionId.STR(), new CookieOptions { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict, Expires = DateTimeOffset.UtcNow.AddHours(24) });


                }
                else
                {
                    throw new Exception("Usuario no autorizado.");
                }



            }
            else
            {

                throw new Exception("Los datos de inicio de sesión no son válidos.");


            }


        }

        #endregion


        #region "Public Methods"



        public async Task InitializeAsync(HttpContext iHttpContextAccessor)
        {

            this._httpContext = iHttpContextAccessor;

            if (this.isInitialized) return;

            if (this._httpContext == null)
                throw new Exception("HttpContext no disponible.");

            var dinaup_sessionid = this._httpContext.Request.Cookies["dinaup_sessionid"];

            if (dinaup_sessionid.IsGUID())
                await RefreshSessionAsync(dinaup_sessionid.ToGUID());


            isInitialized = true;

        }






        /// <summary>
        /// Logs out the current user, removes the authentication cookie,  
        /// and refreshes the user state so that all <see cref="AuthorizeView"/> components are updated accordingly.
        /// </summary>
        public async Task LogoutAsync()
        {
            // Eliminar sesión del KV si existe
            if (this._httpContext.IsNotNull())
            {
                var dinaup_sessionid = this._httpContext.Request.Cookies["dinaup_sessionid"];
                if (dinaup_sessionid.IsGUID())
                {
                    try
                    {
                        // Eliminar del KV (guardar vacío significa eliminar)
                        await _MyAppKVClient.SetKVAsync($"session:{dinaup_sessionid}", "");
                    }
                    catch { }
                }

                // Eliminar cookie
                this._httpContext.Response.Cookies.Delete("dinaup_sessionid");
            }

            User = null;
            NotifyStateChanged();
        }






        #endregion

        private void NotifyStateChanged()
        {
            try { OnChange?.Invoke(); } catch { }
        }

        private async Task RefreshSessionAsync(Guid sessionId)
        {

            if (sessionId.IsNotEmpty())
            {
                try
                {
                    // Intentar recuperar sesión del KV
                    string sessionJson = await _MyAppKVClient.GetKVAsync($"session:{sessionId}");

                    if (sessionJson.IsNotEmpty())
                    {

                        var sessionData = JsonSerializer.Deserialize<DinaZen.Shared.Models.SessionDataModel>(sessionJson);

                        // Verificar si la sesión ha expirado
                        if (sessionData.IsExpired)
                        {
                            // Sesión expirada, eliminar
                            await _MyAppKVClient.SetKVAsync($"session:{sessionId}", "");
                            this._httpContext.Response.Cookies.Delete("dinaup_sessionid");
                            User = null;
                            NotifyStateChanged();
                            return;
                        }
                        else
                        {



                            DinaupClient = new Dinaup.MyAppClient(_externalAppSettings, sessionData.TenantConnectionKeyword,sessionData.UserEmail );


                            var sessionDetails = await DinaupClient.Session_GetDetailsAsync(sessionId, GetUserAgent(this._httpContext), GetUserIP(this._httpContext));
                            if (sessionDetails.IsNotNull() && sessionDetails.Details.IsNotNull() && sessionDetails.Details.IsLogued)
                            {
                                User = sessionDetails.Details;
                                NotifyStateChanged();
                                return;
                            }
                        }
                    }
                }
                catch
                {
                }


            }

            if (User.IsNotNull())
            {
                User = null;
                this._httpContext.Response.Cookies.Delete("dinaup_sessionid");
                NotifyStateChanged();
            }


        }


        #region "Helper Methods"

        /// <summary>
        /// Obtiene el User-Agent del HttpContext
        /// </summary>
        private static string GetUserAgent(HttpContext context)
        {
            if (context?.Request?.Headers == null) return "";
            return context.Request.Headers["User-Agent"].ToString();
        }

        /// <summary>
        /// Obtiene la IP del cliente desde el HttpContext
        /// </summary>
        private static string GetUserIP(HttpContext context)
        {
            if (context?.Connection?.RemoteIpAddress == null) return "";

            // Intentar obtener la IP real desde X-Forwarded-For (en caso de proxy/load balancer)
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].ToString();
            if (forwardedFor.IsNotEmpty())
            {
                var ips = forwardedFor.Split(',');
                if (ips.Length > 0)
                    return ips[0].Trim();
            }

            return context.Connection.RemoteIpAddress.ToString();
        }

        #endregion

    }
}

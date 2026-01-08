

# KVCard

<div class="d-flex gap-2 flex-wrap  justify-content-start">


        <!-- Usuarios -->
        <KVCard  Icon="person"
                    IconColor="@Colors.Black"
                    Tile="Usuarios"
                    Value="@($"{Status.EstadoCantidadDeUsuariosTotales}")"
                    Style="width:200px" />

        <!-- GB BD -->
        <KVCard Icon="storage"
                    IconColor="@Colors.Black"
                    Tile="Base de datos GB"
                    Value="@($"{CultureService.ToStringDecimal(Status.EstadoGbBaseDeDatos)}")"
                    Style="width:200px" />

        <!-- GB Archivos -->
        <KVCard Icon="insert_drive_file"
                    IconColor="@Colors.Black"
                    Tile="Archivos GB"
                    Value="@($"{CultureService.ToStringDecimal(Status.EstadoGbArchivos)}")"
                    Style="width:200px" />

        <!-- APIs -->
        <KVCard Icon="webhook"
                    IconColor="@Colors.Black"
                    Tile="vCores APIs"
                    Value="@($"{Status.EstadoCantidadDeClavesApi}")"
                    Style="width:200px" />

        <!-- Almacenes -->
        <KVCard Icon="warehouse"
                    IconColor="@Colors.Black"
                    Tile="Almacenes"
                    Value="@($"{Status.EstadoAlmacenes}")"
                    Style="width:200px" />
</div>



# Stats display


<div class="container py-4">

    <StatsDisplay Statistics="SubscriptionStats" />
    
</div>

@code {
    // Definimos la lista de estadísticas que vamos a mostrar.
    private List<StatsDisplay.StatisticModel> SubscriptionStats = new();

    protected override void OnInitialized()
    {
        // Rellenamos la lista con los datos.
        // Puedes cargar estos datos desde una API o cualquier otra fuente.
        SubscriptionStats = new List<StatsDisplay.StatisticModel>
        {
            new() { Value = "18", Label = "Usuarios" },
            new() { Value = "1,45", Label = "Base de Datos", Unit = "GB" },
            new() { Value = "0,15", Label = "Archivos", Unit = "GB" },
            new() { Value = "2", Label = "VCores APIs" },
            new() { Value = "3", Label = "Almacenes" }
        };
    }
}


# Dialogs
```
<DinaZen.DialogLayout>
	<TitleContent>
		<h2 class="m-0 p-0">Seleccionar Plan</h2>	
	</TitleContent>
	<BodyContent>
		<SeleccionarPlanU OnPlanSeleccionado="OnPlanSeleccionadoAsync" />
	</BodyContent>
	<FooterContent>
		<div class="d-flex justify-content-end gap-1  align-items-center " style="margin-right:20px">
			<RadzenButton Click=@Cerrar ButtonStyle="ButtonStyle.Danger" Text="Cerrar" Icon="close" Variant="Variant.Text"></RadzenButton>
		</div>
	</FooterContent>
</DinaZen.DialogLayout>


@code{

	private bool  isClosed = false;
	void Cerrar()
	{
		if (isClosed) return;
			isClosed = true;
			DialogService.Close();
	}
	async Task OnPlanSeleccionadoAsync(Guid plantId)
	{
		if (!isClosed)
		{
			isClosed = true;
			await Task.Delay(500);
			DialogService.Close(plantId);
		}
	}

}

```
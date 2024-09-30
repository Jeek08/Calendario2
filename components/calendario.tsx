'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronUp, ChevronDown } from 'lucide-react';
import { jsPDF } from "jspdf";

interface Actividades {
  [fecha: string]: string[];
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

export function CalendarioComponent() {
  const [mes, setMes] = useState<number>(new Date().getMonth());
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [actividades, setActividades] = useState<Actividades>({});

  const obtenerDiasEnMes = (mes: number, anio: number): number => {
    return new Date(anio, mes + 1, 0).getDate();
  };

  const obtenerPrimerDia = (mes: number, anio: number): number => {
    return new Date(anio, mes, 1).getDay();
  };

  const cargarActividades = async () => {
    const response = await fetch(`/api/agregarActividad?mes=${mes + 1}&anio=${anio}`);
    if (response.ok) {
      const data = await response.json();
      const actividadesCargadas = data.actividades.reduce((acc: Actividades, { fecha, actividad }: { fecha: string; actividad: string }) => {
        acc[fecha] = [...(acc[fecha] || []), actividad];
        return acc;
      }, {});
      setActividades(actividadesCargadas);
    } else {
      console.error('Error al cargar las actividades');
    }
  };

  useEffect(() => {
    cargarActividades(); // Cargar actividades al montar el componente
  }, [mes, anio]); // Dependencias para recargar actividades

  const agregarActividad = async (dia: number, actividad: string) => {
    const fecha = `${anio}-${mes + 1}-${dia}`; // Ajustar mes a formato correcto
    const response = await fetch('/api/agregarActividad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fecha, actividad }),
    });

    if (response.ok) {
      setActividades(prev => ({
        ...prev,
        [fecha]: [...(prev[fecha] || []), actividad],
      }));
    } else {
      console.error('Error al agregar la actividad');
    }
  };

  const cambiarMes = (direccion: number) => {
    setMes(prevMes => {
      let nuevoMes = (prevMes + direccion + 12) % 12;
      if (nuevoMes === 11 && direccion === 1) {
        setAnio(prevAnio => prevAnio + 1);
      } else if (nuevoMes === 0 && direccion === -1) {
        setAnio(prevAnio => prevAnio - 1);
      }
      return nuevoMes;
    });
  };

  const exportarActividades = () => {
    const pdf = new jsPDF();
    let y = 20;

    Object.entries(actividades).forEach(([fecha, acts]) => {
      const [anioAct, mesAct, diaAct] = fecha.split('-').map(Number);
      
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(16);
      pdf.text(`${meses[mesAct - 1]} ${anioAct}`, 20, y); // Ajustamos el mes
      y += 10;

      pdf.setFontSize(12);
      const diaSemana = diasSemana[new Date(anioAct, mesAct - 1, diaAct).getDay()];
      const texto = `${diaSemana} ${diaAct}: ${acts.join(', ')}`;
      
      pdf.text(texto, 20, y);
      y += 10;
    });

    pdf.save(`actividades_calendario.pdf`);
  };

  const diasEnMes = obtenerDiasEnMes(mes, anio);
  const primerDia = obtenerPrimerDia(mes, anio);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#4DB6AC] to-[#26A69A] text-white p-8">
      <div className="w-24 mr-8 flex flex-col items-center justify-center">
        <div className="transform -rotate-90 flex items-center space-x-4 whitespace-nowrap">
          <Button
            onClick={() => cambiarMes(-1)}
            className="p-2 bg-white text-[#4DB6AC] hover:bg-[#E0F2F1] transition-colors duration-300"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
          <span className="text-4xl font-bold">{meses[mes]}</span>
          <span className="text-4xl font-bold">{anio}</span>
          <Button
            onClick={() => cambiarMes(1)}
            className="p-2 bg-white text-[#4DB6AC] hover:bg-[#E0F2F1] transition-colors duration-300"
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl" id="calendario">
        <div className="grid grid-cols-7 gap-4">
          {diasSemana.map(dia => (
            <div key={dia} className="text-center font-bold text-lg">{dia}</div>
          ))}
          {Array.from({ length: primerDia - 1 }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}
{Array.from({ length: diasEnMes }).map((_, index) => {
  const dia = index + 1;
  const fechaKey = `${anio}-${mes + 1}-${dia}`; // Ajustar mes a formato correcto
  const tieneActividades = actividades[fechaKey]?.length > 0;

  return (
    <Popover key={dia}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-20 w-full relative overflow-hidden transition-all duration-300 ease-in-out
            ${tieneActividades 
              ? 'bg-white text-[#4DB6AC] border-[#FF9800] border-2 hover:bg-[#E0F2F1]' 
              : 'bg-[#4DB6AC]/50 border-white/30 hover:bg-[#4DB6AC]/70'}`}
        >
          <div className="absolute top-1 left-1 font-bold text-lg">{dia}</div>
          {tieneActividades && (
            <div className="absolute bottom-1 right-1">
              <Check className="h-5 w-5 text-[#FF9800]" />
            </div>
          )}
          {tieneActividades && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <span className="text-xs">{actividades[fechaKey].length} actividad(es)</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-[#E0F2F1] border-[#4DB6AC]">
        <div className="space-y-2">
          <h3 className="font-bold text-[#00796B]">Actividades para el día {dia}</h3>
          {actividades[fechaKey]?.length > 0 ? (
            actividades[fechaKey].map((actividad, index) => (
              <div key={index} className="bg-white p-2 rounded text-[#00796B]">{actividad}</div>
            ))
          ) : (
            <div className="text-gray-500">No hay actividades para este día.</div>
          )}
          <Input
            placeholder="Agregar nueva"
            className="border-[#4DB6AC] focus:ring-[#26A69A]"
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                const input = e.currentTarget;
                input.disabled = true;

                try {
                  await agregarActividad(dia, input.value);
                  input.value = '';
                } finally {
                  input.disabled = false;
                }
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
})}

        </div>
      </div>
      <div className="w-64 ml-8">
        <Button onClick={exportarActividades} className="bg-white text-[#4DB6AC] hover:bg-[#E0F2F1] transition-colors duration-300">
          Exportar Actividades
        </Button>
      </div>
    </div>
  );
}
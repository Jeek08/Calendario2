// pages/api/agregarActividad.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connection from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { fecha, actividad } = req.body;

    try {
      const [result] = await connection.execute(
        'INSERT INTO actividades (fecha, actividad) VALUES (?, ?)',
        [fecha, actividad]
      );

      res.status(200).json({ message: 'Actividad agregada', id: (result as any).insertId });
    } catch (error: any) {
      console.error('Error al agregar actividad:', error.message); // Mensaje de error más específico
      res.status(500).json({ message: 'Error al agregar actividad' });
    }
  } else if (req.method === 'GET') {
    const { mes, anio } = req.query;

    try {
      const [rows] = await connection.execute(
        'SELECT fecha, actividad FROM actividades WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?',
        [mes, anio]
      );

      // Log para ver qué filas se obtienen
      console.log('Actividades obtenidas:', rows);

      res.status(200).json({ actividades: rows });
    } catch (error: any) {
      console.error('Error en la consulta de actividades:', error.message); // Mensaje de error más específico
      res.status(500).json({ message: 'Error al obtener actividades' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}

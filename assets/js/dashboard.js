document.addEventListener('DOMContentLoaded', () => {
    fetchHabits();
});

function fetchHabits() {
    fetch('get_habits.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error:', data.message);
                return;
            }

            const container = document.getElementById('habitsContainer');
            container.innerHTML = '';

            if (data.habitos.length === 0) {
                container.innerHTML = '<p>No tienes hábitos aún. Crea uno nuevo.</p>';
                return;
            }

            data.habitos.forEach(habit => {
                const card = document.createElement('div');
                card.className = 'habit-card';
                card.innerHTML = `
                    <h3>${habit.nombre}</h3>
                    <p>${habit.descripcion || 'Sin descripción'}</p>
                    <p><strong>Tipo:</strong> ${habit.tipo}</p>
                    ${habit.tipo === 'numeric' ? `<p><strong>Meta:</strong> ${habit.meta} ${habit.unidad}</p>` : ''}
                `;
                container.appendChild(card);
            });

            document.getElementById('totalHabits').textContent = data.habitos.length;
        })
        .catch(err => console.error('Error al cargar hábitos:', err));
}

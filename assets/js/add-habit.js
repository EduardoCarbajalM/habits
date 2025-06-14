document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('habitForm');
    const habitSelect = document.getElementById('habitSelect');
    const habitName = document.getElementById('habitName');
    const habitType = document.getElementById('habitType');
    const numericConfig = document.getElementById('numericConfig');
    const reminderToggle = document.getElementById('habitReminder');
    const reminderTime = document.getElementById('reminderTime');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Mostrar/ocultar configuración numérica
    habitType.addEventListener('change', () => {
        numericConfig.style.display = habitType.value === 'numeric' ? 'block' : 'none';
    });

    // Mostrar/ocultar recordatorio
    reminderToggle.addEventListener('change', () => {
        reminderTime.style.display = reminderToggle.checked ? 'block' : 'none';
    });

    // Manejar selección de hábito
    habitSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            // Habilitar campos para hábito personalizado
            habitName.disabled = false;
            habitType.disabled = false;
            habitName.value = '';
            habitType.value = '';
            numericConfig.style.display = 'none';
        } else if (this.value) {
            // Autocompletar con hábito seleccionado
            const selectedOption = this.options[this.selectedIndex];
            habitName.value = selectedOption.text;
            habitName.disabled = true;
            habitType.value = selectedOption.dataset.type;
            habitType.disabled = true;
            
            if (selectedOption.dataset.type === 'numeric') {
                numericConfig.style.display = 'block';
                document.getElementById('habitTarget').value = selectedOption.dataset.target || '';
                document.getElementById('habitUnit').value = selectedOption.dataset.unit || '';
            } else {
                numericConfig.style.display = 'none';
            }
        }
    });

    // Enviar formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        loadingSpinner.style.display = 'flex';

        const isCustom = habitSelect.value === 'custom';
        const formData = {
            habitId: isCustom ? null : habitSelect.value,
            habitName: habitName.value.trim(),
            habitDescription: document.getElementById('habitDescription').value.trim(),
            habitType: habitType.value,
            habitTarget: document.getElementById('habitTarget')?.value || null,
            habitUnit: document.getElementById('habitUnit')?.value || null,
            reminderTimeInput: document.getElementById('reminderTimeInput')?.value || null,
            isCustom: isCustom
        };

        try {
            const response = await fetch('save_habit.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = 'index.php';
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Error de conexión: ' + error.message);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // Generar UUID para hábitos personalizados
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});
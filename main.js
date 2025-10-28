const htmlElement = document.documentElement;
let usdToVndRate = 0; // Biến toàn cục lưu tỷ giá
let pikachuDataCache = null; // Biến cache dữ liệu Pikachu
let isPikachuShiny = false; // Trạng thái xem Shiny/Normal

// 1. Logic chuyển đổi Sáng/Tối (Dark/Light Mode)
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// Hàm kiểm tra và áp dụng chế độ
function applyTheme(isDark) {
    if (isDark) {
        htmlElement.classList.add('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        localStorage.setItem('theme', 'dark');
    } else {
        htmlElement.classList.remove('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        localStorage.setItem('theme', 'light');
    }
}

// Khởi tạo Theme
const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'light') {
    applyTheme(false);
} else {
    // Mặc định là Dark Mode (do class="dark" trong HTML)
    applyTheme(true);
}

// Xử lý sự kiện click
themeToggle.addEventListener('click', () => {
    const isDark = htmlElement.classList.contains('dark');
    applyTheme(!isDark);
});

// 2. Logic Menu Mobile
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

const mobileLinks = mobileMenu.querySelectorAll('a');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// 3. Logic xử lý Form Liên Hệ (chỉ mô phỏng)
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');

contactForm.addEventListener('submit', function(event) {
    event.preventDefault(); 
    const name = document.getElementById('name').value;
    formMessage.textContent = 'Đang gửi...';
    formMessage.classList.remove('hidden', 'text-green-500', 'text-red-500');
    formMessage.classList.add('text-gray-500');

    setTimeout(() => {
        formMessage.textContent = `Cảm ơn ${name}! Tin nhắn của bạn đã được gửi thành công. Tôi sẽ phản hồi sớm nhất có thể.`;
        formMessage.classList.remove('text-gray-500');
        formMessage.classList.add('text-green-500');
        formMessage.classList.remove('hidden');
        contactForm.reset();
    }, 1500);
});

// --- LOGIC TÍCH HỢP API ---

// 4. Logic Lấy dữ liệu Pikachu từ PokeAPI
const pikachuDataElement = document.getElementById('pikachu-data');
const toggleShinyButton = document.getElementById('toggle-shiny-button');

// Hàm render Pikachu ra giao diện
function renderPikachu() {
    if (!pikachuDataCache) return;

    const data = pikachuDataCache;
    
    const pikachuImage = isPikachuShiny 
        ? data.sprites.front_shiny 
        : data.sprites.front_default;

    const pikachuAbilities = data.abilities.map(a => a.ability.name).join(', ');
    const pikachuWeight = data.weight / 10; // Convert to kg
    const statusText = isPikachuShiny ? 'Shiny' : 'Normal';

    pikachuDataElement.innerHTML = `
        <img src="${pikachuImage}" alt="Pikachu ${statusText}" class="mx-auto w-32 h-32 object-contain animate-bounce-y">
        <p class="text-3xl font-extrabold text-poke-yellow mt-4">#${data.id} ${data.name.toUpperCase()} (${statusText})</p>
        <p class="text-lg text-gray-300 mt-2">Cân nặng: ${pikachuWeight} kg</p>
        <p class="text-md text-gray-400 mt-1">Khả năng: ${pikachuAbilities}</p>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
            <span class="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">Type: ${data.types[0].type.name.toUpperCase()}</span>
        </div>
    `;
    
    toggleShinyButton.textContent = isPikachuShiny ? 'Xem Normal' : 'Xem Shiny';
}

// Hàm lấy dữ liệu Pikachu
async function fetchPikachu() {
    const apiUrl = 'https://pokeapi.co/api/v2/pokemon/pikachu';
    pikachuDataElement.innerHTML = `
        <div class="flex justify-center items-center h-48">
            <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-400 ml-3">Đang tải dữ liệu...</p>
        </div>
    `;
    toggleShinyButton.disabled = true;


    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu Pikachu.');
        }
        pikachuDataCache = await response.json();
        renderPikachu();
    } catch (error) {
        console.error("Lỗi khi tải Pikachu:", error);
        pikachuDataElement.innerHTML = `<p class="text-red-400">Lỗi: Không tải được Pikachu.</p>`;
    } finally {
        toggleShinyButton.disabled = false;
    }
}

// Xử lý sự kiện chuyển đổi Shiny
toggleShinyButton.addEventListener('click', () => {
    isPikachuShiny = !isPikachuShiny;
    renderPikachu();
});


// 5. Logic Chuyển đổi Tỷ giá hối đoái (SỬ DỤNG EXCHANGERATE-API)
const refreshRateButton = document.getElementById('refresh-rate-button');
const currentRateDisplay = document.getElementById('current-rate-display');
const usdInput = document.getElementById('usd-input');
const vndInput = document.getElementById('vnd-input');

// Hàm để làm sạch giá trị nhập, chỉ giữ lại số và dấu chấm thập phân
function cleanInput(value) {
    // Loại bỏ tất cả các ký tự không phải số, dấu chấm (cho USD) hoặc dấu phẩy (cho VND)
    // và thay thế dấu phẩy (dùng cho VND) bằng dấu chấm (chuẩn JS/TS)
    return value.toString().replace(/,/g, '').replace(/[^\d.]/g, '');
}

// Hàm tính toán và hiển thị kết quả
function convertCurrency(source, rawValue) {
    const cleanValue = cleanInput(rawValue);
    const amount = parseFloat(cleanValue);
    
    // Nếu không phải là số hợp lệ hoặc tỷ giá chưa có
    if (isNaN(amount) || amount <= 0 || usdToVndRate === 0) {
        if (source === 'USD') {
            vndInput.value = '';
        } else {
            usdInput.value = '';
        }
        return;
    }

    if (source === 'USD') {
        // USD -> VND
        const vndResult = (amount * usdToVndRate).toFixed(0); // Làm tròn VND
        // Hiển thị VND với định dạng dấu phẩy
        vndInput.value = vndResult.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else if (source === 'VND') {
        // VND -> USD
        const usdResult = (amount / usdToVndRate).toFixed(2); // Giữ 2 số thập phân cho USD
        // Hiển thị USD không cần định dạng dấu phẩy (vì là USD)
        usdInput.value = usdResult;
    }
}

// Gắn sự kiện nhập liệu cho USD
usdInput.addEventListener('input', (e) => {
    // Loại bỏ các ký tự không phải số và dấu chấm trong USD input
    let value = e.target.value;
    value = value.replace(/[^\d.]/g, '');
    e.target.value = value;
    
    convertCurrency('USD', value);
});

// Gắn sự kiện nhập liệu cho VND
vndInput.addEventListener('input', (e) => {
    // Xóa định dạng dấu phẩy trước khi tính toán
    let rawVndValue = e.target.value.replace(/,/g, '');
    rawVndValue = rawVndValue.replace(/[^\d]/g, ''); // Chỉ giữ lại số
    
    // Tính toán và hiển thị USD
    convertCurrency('VND', rawVndValue);
    
    // Định dạng lại VND input với dấu phẩy
    if (rawVndValue) {
        e.target.value = rawVndValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        e.target.value = '';
    }
});

// Hàm lấy tỷ giá từ API
async function fetchExchangeRate() {
    // SỬ DỤNG EXCHANGERATE-API
    const apiUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
    
    // Hiển thị trạng thái tải và vô hiệu hóa nút
    currentRateDisplay.innerHTML = `Đang tải...`;
    refreshRateButton.disabled = true;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Lỗi mạng hoặc API không phản hồi.');
        }
        const data = await response.json();
        
        // KIỂM TRA DỮ LIỆU CỦA EXCHANGERATE-API
        if (!data.rates || !data.rates.VND) {
            throw new Error('Không tìm thấy tỷ giá VND trong phản hồi API.');
        }
        
        usdToVndRate = data.rates.VND;
        const formattedRate = usdToVndRate.toLocaleString('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        const date = new Date().toLocaleDateString('vi-VN'); // API này không cung cấp ngày chính xác trong v4, dùng ngày hiện tại

        currentRateDisplay.innerHTML = `
            1 USD = <span class="text-xl font-bold">${formattedRate} VND</span> (Cập nhật: ${date})
        `;
        
        // Khởi tạo chuyển đổi mặc định cho giá trị 1 USD (sử dụng giá trị hiện tại của input USD)
        convertCurrency('USD', usdInput.value || 1); 

    } catch (error) {
        console.error("Lỗi khi tải tỷ giá:", error);
        usdToVndRate = 0; // Đặt về 0 nếu lỗi
        currentRateDisplay.innerHTML = `<span class="text-red-400">Lỗi: ${error.message}. Không thể chuyển đổi.</span>`;
    } finally {
        refreshRateButton.disabled = false;
    }
}

// Thêm sự kiện click cho nút làm mới tỷ giá
refreshRateButton.addEventListener('click', fetchExchangeRate);


// 6. Logic Lấy dữ liệu Thời tiết từ Open-Meteo
const refreshWeatherButton = document.getElementById('refresh-weather-button'); 
const weatherDataElement = document.getElementById('weather-data'); 
const weatherLocationElement = document.getElementById('weather-location'); // Element hiển thị vị trí

function getWeatherIcon(wmoCode) {
    const icons = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌧️', 53: '🌧️', 
        55: '🌧️', 61: '🌦️', 63: '🌧️', 65: '⛈️', 71: '🌨️', 73: '🌨️', 75: '🌨️', 
        80: '☔', 81: '☔', 82: '⛈️', 95: '🌩️', 96: '⛈️', 99: '⛈️',
    };
    return icons[wmoCode] || '❓';
}

function getWeatherDescription(wmoCode) {
    const descriptions = {
        0: 'Trời Quang Mây', 1: 'Chủ yếu quang mây', 2: 'Mây rải rác', 3: 'Trời Âm U',
        45: 'Có Sương Mù', 48: 'Sương mù đóng băng', 51: 'Mưa phùn nhẹ', 53: 'Mưa phùn vừa',
        55: 'Mưa phùn đậm', 61: 'Mưa nhẹ', 63: 'Mưa vừa', 65: 'Mưa to', 71: 'Tuyết rơi nhẹ',
        73: 'Tuyết rơi vừa', 75: 'Tuyết rơi dày', 80: 'Mưa rào nhẹ', 81: 'Mưa rào vừa',
        82: 'Mưa rào lớn', 95: 'Giông bão', 96: 'Giông bão kèm mưa đá nhỏ', 99: 'Giông bão kèm mưa đá lớn',
    };
    return descriptions[wmoCode] || 'Không xác định';
}

// Hàm chính để lấy tọa độ và tải thời tiết
function fetchWeatherByLocation() {
    // Hàm sẽ được gọi khi lấy tọa độ thành công
    const success = (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        // Cập nhật vị trí hiển thị
        weatherLocationElement.textContent = `Vị trí hiện tại: (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        loadWeather(lat, lon);
    };

    // Hàm sẽ được gọi khi lấy tọa độ thất bại
    const error = (err) => {
        console.warn(`LỖI GEOLOCATION (${err.code}): ${err.message}`);
        // Tọa độ mặc định mới: TP. Hồ Chí Minh
        const defaultLat = 10.8231; 
        const defaultLon = 106.6297;
        weatherLocationElement.textContent = `Mô phỏng tại: TP. Hồ Chí Minh (10.8231, 106.6297) (Vị trí bị từ chối/Không hỗ trợ)`;
        loadWeather(defaultLat, defaultLon);
    };

    // Cấu hình Geolocation API
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    // Kiểm tra xem trình duyệt có hỗ trợ Geolocation không
    if (navigator.geolocation) {
        weatherLocationElement.textContent = 'Đang tìm vị trí hiện tại...';
        navigator.geolocation.getCurrentPosition(success, error, options);
    } else {
        error({code: 0, message: "Trình duyệt không hỗ trợ Geolocation."});
    }
}

// Hàm tải dữ liệu thời tiết từ Open-Meteo
async function loadWeather(lat, lon) {
    
    weatherDataElement.innerHTML = `
        <div class="flex flex-col justify-center items-center h-48">
            <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-400 ml-3 mt-2">Đang tải dữ liệu...</p>
        </div>
    `;
    if (refreshWeatherButton) {
        refreshWeatherButton.disabled = true;
    }

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu thời tiết từ API.');
        }
        const data = await response.json();
        const currentWeather = data.current_weather;

        const temp = currentWeather.temperature;
        const windSpeed = currentWeather.windspeed;
        const wmoCode = currentWeather.weathercode;
        
        const icon = getWeatherIcon(wmoCode);
        const description = getWeatherDescription(wmoCode);
        
        weatherDataElement.innerHTML = `
            <div class="text-6xl my-4">${icon}</div>
            <p class="text-5xl font-extrabold text-blue-400">${temp}°C</p>
            <p class="text-xl text-gray-300 mt-2">${description}</p>
            <p class="text-md text-gray-400 mt-1">Tốc độ gió: ${windSpeed} km/h</p>
            <div class="mt-4 flex flex-wrap justify-center gap-2">
                <span class="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">WMO Code: ${wmoCode}</span>
            </div>
        `;

    } catch (error) {
        console.error("Lỗi khi tải thời tiết:", error);
        weatherDataElement.innerHTML = `<p class="text-red-400">Lỗi: ${error.message}.</p>`;
    } finally {
        if (refreshWeatherButton) {
            refreshWeatherButton.disabled = false;
        }
    }
}

// Gọi API khi trang được tải xong và thiết lập sự kiện làm mới
window.onload = function() {
    fetchPikachu();
    fetchWeatherByLocation(); // Thay thế fetchWeather cũ bằng hàm mới

    // Gắn sự kiện click cho nút làm mới thời tiết sau khi DOM đã tải
    const refreshWeatherButtonElement = document.getElementById('refresh-weather-button');
    if (refreshWeatherButtonElement) {
        // Khi người dùng bấm làm mới, gọi lại hàm lấy vị trí và thời tiết
        refreshWeatherButtonElement.addEventListener('click', fetchWeatherByLocation);
    }
    
    fetchExchangeRate();
};
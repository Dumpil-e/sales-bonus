/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const {discount ,sale_price, quantity } = purchase;
    const discountFactor = 1 - (discount / 100);
    return sale_price * quantity * discountFactor;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) return seller.profit * 0.15;
    if (index === 1 || index === 2) return seller.profit * 0.10;
    if (index === total -1) return 0;
    return seller.profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные.');
    }

    // @TODO: Проверка наличия опций
    //проверяем что опции объект и не пустые
    if (typeof options !== "object" || options === null) {
        throw new Error("Параметр 'options' должен быть объектом.");
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Отсутствует список продуктов.');
    }
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Отсутствует список продаж.');
    }
    // деструктурируем опции
    const { calculateRevenue, calculateBonus } = options;
    // проверяем что в функцию переданы одноименные параметры
    if (!calculateRevenue || !calculateBonus) {
        throw new Error("В объекте 'options' должны быть определены 'calculateRevenue' и 'calculateBonus'.");
    }
    //проверяем что переданные параметры являются функциями
    if (typeof calculateBonus !== "function" || typeof calculateRevenue !== "function") {
        throw new Error("calculateBonus и calculateRevenue должны быть функциями")
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = Object.fromEntries(data.sellers.map(seller => [seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => { // Чек

        const seller = sellerIndex[record.seller_id]; // Продавец
        const stat = sellerStats.find(stat => stat.id === seller.id); // Статистика продавца

        // Увеличить количество продаж
        stat.sales_count += 1;
        // Увеличить общую сумму всех продаж


        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue(item, product);
            // Посчитать прибыль: выручка минус себестоимость
            const productProfit = revenue - cost;
            // Увеличить общую накопленную прибыль (profit) у продавца
            stat.profit += productProfit;
            // Увеличиваем сумму продаж
            stat.revenue += revenue;

            // Учёт количества проданных товаров
            if (!stat.products_sold[item.sku]) {
                stat.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            stat.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
    })
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: Object.entries(seller.products_sold)
            .sort(([, quantityA], [, quantityB]) => quantityB -  quantityA)
            .slice(0, 10)
            .map(([sku, quantity]) => ({sku, quantity})),
        bonus: +seller.bonus.toFixed(2),
    }));
}

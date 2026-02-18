const { User, Recipe, RecipeElement, DataRecord, RecordValue } = require('./models');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');

const seedData = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      password_hash: adminPassword,
      role: 'admin'
    });
    console.log('Admin user created');

    // 1. Rulo Açıcı (Coil Opener) Recipe
    const coilOpener = await Recipe.create({
      name: 'Rulo Açıcı (Coil Opener)',
      description: 'Coil opening machine parameters for steel coil processing',
      created_by: admin.id
    });

    const coilElements = await RecipeElement.bulkCreate([
      { recipe_id: coilOpener.id, name: 'Coil Width', data_type: 'float', unit: 'mm', min_value: 100, max_value: 2000, default_value: '1250', sort_order: 0 },
      { recipe_id: coilOpener.id, name: 'Coil Thickness', data_type: 'float', unit: 'mm', min_value: 0.3, max_value: 6.0, default_value: '1.5', sort_order: 1 },
      { recipe_id: coilOpener.id, name: 'Line Speed', data_type: 'integer', unit: 'm/min', min_value: 5, max_value: 100, default_value: '30', sort_order: 2 },
      { recipe_id: coilOpener.id, name: 'Tension Force', data_type: 'float', unit: 'kN', min_value: 1, max_value: 50, default_value: '15', sort_order: 3 },
      { recipe_id: coilOpener.id, name: 'Mandrel Expansion', data_type: 'float', unit: 'mm', min_value: 0, max_value: 20, default_value: '8', sort_order: 4 },
      { recipe_id: coilOpener.id, name: 'Brake Pressure', data_type: 'float', unit: 'bar', min_value: 0, max_value: 10, default_value: '3.5', sort_order: 5 },
      { recipe_id: coilOpener.id, name: 'Material Type', data_type: 'string', unit: '', default_value: 'DC01', sort_order: 6 },
      { recipe_id: coilOpener.id, name: 'Auto Mode', data_type: 'boolean', unit: '', default_value: 'true', sort_order: 7 }
    ]);

    // Coil Opener Data Records
    const coilRecord1 = await DataRecord.create({
      recipe_id: coilOpener.id, name: 'Steel DC01 - 1.5mm', record_number: 1, created_by: admin.id
    });
    await RecordValue.bulkCreate([
      { data_record_id: coilRecord1.id, element_id: coilElements[0].id, value: '1250' },
      { data_record_id: coilRecord1.id, element_id: coilElements[1].id, value: '1.5' },
      { data_record_id: coilRecord1.id, element_id: coilElements[2].id, value: '35' },
      { data_record_id: coilRecord1.id, element_id: coilElements[3].id, value: '18' },
      { data_record_id: coilRecord1.id, element_id: coilElements[4].id, value: '10' },
      { data_record_id: coilRecord1.id, element_id: coilElements[5].id, value: '4.0' },
      { data_record_id: coilRecord1.id, element_id: coilElements[6].id, value: 'DC01' },
      { data_record_id: coilRecord1.id, element_id: coilElements[7].id, value: 'true' }
    ]);

    const coilRecord2 = await DataRecord.create({
      recipe_id: coilOpener.id, name: 'Galvanized DX51 - 0.8mm', record_number: 2, created_by: admin.id
    });
    await RecordValue.bulkCreate([
      { data_record_id: coilRecord2.id, element_id: coilElements[0].id, value: '1000' },
      { data_record_id: coilRecord2.id, element_id: coilElements[1].id, value: '0.8' },
      { data_record_id: coilRecord2.id, element_id: coilElements[2].id, value: '45' },
      { data_record_id: coilRecord2.id, element_id: coilElements[3].id, value: '12' },
      { data_record_id: coilRecord2.id, element_id: coilElements[4].id, value: '6' },
      { data_record_id: coilRecord2.id, element_id: coilElements[5].id, value: '2.5' },
      { data_record_id: coilRecord2.id, element_id: coilElements[6].id, value: 'DX51D+Z' },
      { data_record_id: coilRecord2.id, element_id: coilElements[7].id, value: 'true' }
    ]);

    console.log('Coil Opener recipe created with 2 records');

    // 2. Press Machine Recipe
    const pressMachine = await Recipe.create({
      name: 'Pres Makinesi (Press Machine)',
      description: 'Hydraulic press machine parameters for metal forming operations',
      created_by: admin.id
    });

    const pressElements = await RecipeElement.bulkCreate([
      { recipe_id: pressMachine.id, name: 'Press Force', data_type: 'integer', unit: 'tons', min_value: 10, max_value: 1000, default_value: '250', sort_order: 0 },
      { recipe_id: pressMachine.id, name: 'Stroke Length', data_type: 'float', unit: 'mm', min_value: 10, max_value: 500, default_value: '150', sort_order: 1 },
      { recipe_id: pressMachine.id, name: 'Pressing Speed', data_type: 'float', unit: 'mm/s', min_value: 1, max_value: 100, default_value: '25', sort_order: 2 },
      { recipe_id: pressMachine.id, name: 'Dwell Time', data_type: 'float', unit: 'sec', min_value: 0.1, max_value: 30, default_value: '2.0', sort_order: 3 },
      { recipe_id: pressMachine.id, name: 'Return Speed', data_type: 'float', unit: 'mm/s', min_value: 10, max_value: 200, default_value: '80', sort_order: 4 },
      { recipe_id: pressMachine.id, name: 'Die Temperature', data_type: 'integer', unit: '°C', min_value: 20, max_value: 300, default_value: '25', sort_order: 5 },
      { recipe_id: pressMachine.id, name: 'Cycle Count Target', data_type: 'integer', unit: 'pcs', min_value: 1, max_value: 100000, default_value: '1000', sort_order: 6 }
    ]);

    const pressRecord1 = await DataRecord.create({
      recipe_id: pressMachine.id, name: 'Deep Drawing - Panel', record_number: 1, created_by: admin.id
    });
    await RecordValue.bulkCreate([
      { data_record_id: pressRecord1.id, element_id: pressElements[0].id, value: '320' },
      { data_record_id: pressRecord1.id, element_id: pressElements[1].id, value: '180' },
      { data_record_id: pressRecord1.id, element_id: pressElements[2].id, value: '15' },
      { data_record_id: pressRecord1.id, element_id: pressElements[3].id, value: '3.5' },
      { data_record_id: pressRecord1.id, element_id: pressElements[4].id, value: '100' },
      { data_record_id: pressRecord1.id, element_id: pressElements[5].id, value: '45' },
      { data_record_id: pressRecord1.id, element_id: pressElements[6].id, value: '5000' }
    ]);

    console.log('Press Machine recipe created');

    // 3. CNC Machine Recipe
    const cncMachine = await Recipe.create({
      name: 'CNC Tezgahı (CNC Machine)',
      description: 'CNC machining center parameters for precision parts',
      created_by: admin.id
    });

    const cncElements = await RecipeElement.bulkCreate([
      { recipe_id: cncMachine.id, name: 'Spindle Speed', data_type: 'integer', unit: 'RPM', min_value: 100, max_value: 24000, default_value: '8000', sort_order: 0 },
      { recipe_id: cncMachine.id, name: 'Feed Rate', data_type: 'float', unit: 'mm/min', min_value: 1, max_value: 15000, default_value: '2000', sort_order: 1 },
      { recipe_id: cncMachine.id, name: 'Depth of Cut', data_type: 'float', unit: 'mm', min_value: 0.1, max_value: 20, default_value: '2.0', sort_order: 2 },
      { recipe_id: cncMachine.id, name: 'Tool Number', data_type: 'integer', unit: '', min_value: 1, max_value: 60, default_value: '1', sort_order: 3 },
      { recipe_id: cncMachine.id, name: 'Coolant Pressure', data_type: 'float', unit: 'bar', min_value: 0, max_value: 70, default_value: '20', sort_order: 4 },
      { recipe_id: cncMachine.id, name: 'Work Offset', data_type: 'string', unit: '', default_value: 'G54', sort_order: 5 },
      { recipe_id: cncMachine.id, name: 'Program Number', data_type: 'string', unit: '', default_value: 'O0001', sort_order: 6 }
    ]);

    const cncRecord1 = await DataRecord.create({
      recipe_id: cncMachine.id, name: 'Aluminum Roughing', record_number: 1, created_by: admin.id
    });
    await RecordValue.bulkCreate([
      { data_record_id: cncRecord1.id, element_id: cncElements[0].id, value: '12000' },
      { data_record_id: cncRecord1.id, element_id: cncElements[1].id, value: '3500' },
      { data_record_id: cncRecord1.id, element_id: cncElements[2].id, value: '4.0' },
      { data_record_id: cncRecord1.id, element_id: cncElements[3].id, value: '3' },
      { data_record_id: cncRecord1.id, element_id: cncElements[4].id, value: '25' },
      { data_record_id: cncRecord1.id, element_id: cncElements[5].id, value: 'G54' },
      { data_record_id: cncRecord1.id, element_id: cncElements[6].id, value: 'O1001' }
    ]);

    const cncRecord2 = await DataRecord.create({
      recipe_id: cncMachine.id, name: 'Steel Finishing', record_number: 2, created_by: admin.id
    });
    await RecordValue.bulkCreate([
      { data_record_id: cncRecord2.id, element_id: cncElements[0].id, value: '6000' },
      { data_record_id: cncRecord2.id, element_id: cncElements[1].id, value: '800' },
      { data_record_id: cncRecord2.id, element_id: cncElements[2].id, value: '0.3' },
      { data_record_id: cncRecord2.id, element_id: cncElements[3].id, value: '8' },
      { data_record_id: cncRecord2.id, element_id: cncElements[4].id, value: '40' },
      { data_record_id: cncRecord2.id, element_id: cncElements[5].id, value: 'G55' },
      { data_record_id: cncRecord2.id, element_id: cncElements[6].id, value: 'O2005' }
    ]);

    console.log('CNC Machine recipe created');

    // 4. Paint Mixing (RGB Colors) Recipe
    const paintMixing = await Recipe.create({
      name: 'Boya Karıştırma (RGB Colors)',
      description: 'Paint mixing parameters for industrial coating applications',
      created_by: admin.id
    });

    const paintElements = await RecipeElement.bulkCreate([
      { recipe_id: paintMixing.id, name: 'Red', data_type: 'integer', unit: '', min_value: 0, max_value: 255, default_value: '128', sort_order: 0 },
      { recipe_id: paintMixing.id, name: 'Green', data_type: 'integer', unit: '', min_value: 0, max_value: 255, default_value: '128', sort_order: 1 },
      { recipe_id: paintMixing.id, name: 'Blue', data_type: 'integer', unit: '', min_value: 0, max_value: 255, default_value: '128', sort_order: 2 },
      { recipe_id: paintMixing.id, name: 'Color Name', data_type: 'string', unit: '', default_value: 'Custom', sort_order: 3 },
      { recipe_id: paintMixing.id, name: 'Viscosity', data_type: 'float', unit: 'cP', min_value: 50, max_value: 5000, default_value: '500', sort_order: 4 },
      { recipe_id: paintMixing.id, name: 'Mix Time', data_type: 'integer', unit: 'min', min_value: 1, max_value: 60, default_value: '10', sort_order: 5 },
      { recipe_id: paintMixing.id, name: 'Temperature', data_type: 'float', unit: '°C', min_value: 15, max_value: 40, default_value: '25', sort_order: 6 }
    ]);

    const colorRecords = [
      { name: 'RAL 3020 Traffic Red', r: 204, g: 6, b: 5 },
      { name: 'RAL 5015 Sky Blue', r: 0, g: 113, b: 176 },
      { name: 'RAL 6018 Yellow Green', r: 80, g: 169, b: 45 },
      { name: 'RAL 1021 Rape Yellow', r: 252, g: 189, b: 31 },
      { name: 'RAL 9010 Pure White', r: 250, g: 249, b: 245 }
    ];

    for (let i = 0; i < colorRecords.length; i++) {
      const color = colorRecords[i];
      const record = await DataRecord.create({
        recipe_id: paintMixing.id, name: color.name, record_number: i + 1, created_by: admin.id
      });
      await RecordValue.bulkCreate([
        { data_record_id: record.id, element_id: paintElements[0].id, value: String(color.r) },
        { data_record_id: record.id, element_id: paintElements[1].id, value: String(color.g) },
        { data_record_id: record.id, element_id: paintElements[2].id, value: String(color.b) },
        { data_record_id: record.id, element_id: paintElements[3].id, value: color.name },
        { data_record_id: record.id, element_id: paintElements[4].id, value: '450' },
        { data_record_id: record.id, element_id: paintElements[5].id, value: '15' },
        { data_record_id: record.id, element_id: paintElements[6].id, value: '23' }
      ]);
    }

    console.log('Paint Mixing recipe created with 5 color records');

    console.log('\n✅ Seed completed successfully!');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
